import { useCallback, useEffect, useRef, useState } from 'react';
import type { Account } from '../../shared/ipc';
import AccountDialog from './components/AccountDialog';
import Panel from './components/Panel';
import SearchDialog from './components/SearchDialog';
import SettingsDialog from './components/SettingsDialog';
import Toolbar from './components/Toolbar';
import { useConfig } from './hooks/useConfig';
import { useRam } from './hooks/useRam';
import { useUpdate } from './hooks/useUpdate';
import { clamp, gridShape, newAccount, nextPage, screenCount, visibleIds, visibleStart } from './lib/utils';

type DialogState = { kind: 'account'; id: string | null } | { kind: 'settings' } | { kind: 'search' } | null;

export default function App() {
  const [cfg, setCfg] = useConfig();
  const [activeId, setActiveId] = useState<string | null>(() => cfg.accounts[cfg.focus]?.id ?? null);
  const [fullId, setFullId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [gen, setGen] = useState<Record<string, number>>({});
  const [allTick, setAllTick] = useState(0);
  const [focusTo, setFocusTo] = useState<{ id: string; n: number } | null>(null);
  const dragId = useRef<string | null>(null);
  const warned = useRef(false);
  const { version, ready } = useUpdate();
  const ram = useRam();
  const total = cfg.accounts.length;
  const visible = visibleIds(cfg.accounts, cfg.perScreen, cfg.focus);
  const { cols, rows } = gridShape(visible.length);
  const ramHigh = ram !== null && ram > cfg.ramLimit;

  const patch = useCallback(
    (id: string, p: Partial<Account>) => setCfg(c => ({ ...c, accounts: c.accounts.map(a => (a.id === id ? { ...a, ...p } : a)) })),
    [setCfg]
  );

  useEffect(() => void window.api.setAlwaysOnTop(cfg.alwaysOnTop), [cfg.alwaysOnTop]);
  useEffect(() => void window.api.setTray(cfg.tray), [cfg.tray]);
  useEffect(() => void window.api.setKeepAwake(cfg.keepAwake), [cfg.keepAwake]);
  useEffect(() => void window.api.setAutostart(cfg.startWithWindows), [cfg.startWithWindows]);

  useEffect(() => {
    let t = 0;
    const back = () => {
      clearTimeout(t);
      t = window.setTimeout(() => setAllTick(n => n + 1), 4000);
    };
    window.addEventListener('online', back);
    return () => {
      window.removeEventListener('online', back);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (ram === null) return;
    const high = ram > cfg.ramLimit;
    if (high && !warned.current) new Notification('Quad Idle', { body: `Uso de RAM alto: ${ram} MB. Considere fechar uma conta ou live.` });
    warned.current = high;
  }, [ram, cfg.ramLimit]);

  const focusAccount = useCallback(
    (i: number) => {
      const acc = cfg.accounts[i];
      if (!acc) return;
      setCfg(c => ({ ...c, focus: i }));
      setFullId(null);
      setActiveId(acc.id);
      setFocusTo(f => ({ id: acc.id, n: (f?.n ?? 0) + 1 }));
    },
    [cfg.accounts, setCfg]
  );

  useEffect(
    () =>
      window.api.onShortcut(s => {
        if (s === 'escape') setFullId(null);
        else if (s === 'search') setDialog({ kind: 'search' });
        else focusAccount(s - 1);
      }),
    [focusAccount]
  );

  const page = (dir: 1 | -1) => {
    setFullId(null);
    setCfg(c => ({ ...c, focus: nextPage(c.accounts.length, screenCount(c.perScreen, c.accounts.length), c.focus, dir) }));
  };

  const moveAccount = (fromId: string, toId: string) =>
    setCfg(c => {
      const from = c.accounts.findIndex(a => a.id === fromId);
      const to = c.accounts.findIndex(a => a.id === toId);
      if (from < 0 || to < 0 || from === to) return c;
      const accounts = [...c.accounts];
      accounts.splice(to, 0, accounts.splice(from, 1)[0]);
      const focusId = c.accounts[c.focus]?.id;
      return {
        ...c,
        accounts,
        focus: Math.max(
          0,
          accounts.findIndex(a => a.id === focusId)
        )
      };
    });

  const saveAccount = (id: string | null, v: { name: string; url: string }) => {
    if (id) patch(id, v);
    else {
      const acc = newAccount(v);
      setCfg(c => {
        const accounts = [...c.accounts, acc];
        return { ...c, accounts, focus: Math.max(0, accounts.length - screenCount(c.perScreen, accounts.length)) };
      });
    }
    setDialog(null);
  };

  const removeAccount = async (acc: Account) => {
    if (!confirm(`Apagar "${acc.name}"?\nO login salvo dela também será removido.`)) return;
    await window.api.gameDestroy(acc.id);
    setFullId(f => (f === acc.id ? null : f));
    setCfg(c => {
      const accounts = c.accounts.filter(a => a.id !== acc.id);
      return { ...c, accounts, focus: clamp(c.focus, 0, Math.max(0, accounts.length - 1)) };
    });
    await window.api.removeAccount(acc.id);
  };

  const create = () => {
    setDialog({ kind: 'account', id: null });
  };

  const editing = dialog?.kind === 'account' ? (cfg.accounts.find(a => a.id === dialog.id) ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        accountCount={total}
        shownCount={visible.length}
        start={visibleStart(total, visible.length, cfg.focus)}
        ramMb={ram}
        ramHigh={ramHigh}
        version={version}
        onScreens={k => {
          setFullId(null);
          setCfg(c => ({ ...c, perScreen: k >= c.accounts.length ? 0 : k }));
        }}
        onPage={page}
        onSearch={() => setDialog({ kind: 'search' })}
        onCreate={create}
        onSettings={() => setDialog({ kind: 'settings' })}
      />
      {ready && (
        <div className="flex items-center gap-2.5 bg-[#1f3a24] px-2.5 py-1.5">
          <span>Nova versão {ready} baixada.</span>
          <button className="on" onClick={() => void window.api.installUpdate()}>
            Reiniciar e atualizar
          </button>
        </div>
      )}

      <main
        className="relative grid min-h-0 flex-1 gap-1.5 bg-bg p-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {!total && <div className="m-auto text-muted">Nenhuma conta. Clique em “＋ Criar”.</div>}
        {cfg.accounts.map((acc, index) => {
          const onScreen = visible.includes(acc.id);
          const full = fullId === acc.id;
          return (
            <Panel
              key={acc.id}
              acc={acc}
              index={index}
              order={onScreen ? visible.indexOf(acc.id) : 99}
              onScreen={onScreen}
              mountGame={onScreen || full || !cfg.suspendHidden}
              fullscreen={full}
              hiddenByFullscreen={!!fullId && !full}
              active={activeId === acc.id}
              covered={dialog !== null}
              reload={allTick}
              gen={gen[acc.id] ?? 0}
              focusTick={focusTo?.id === acc.id ? focusTo.n : 0}
              reloadHours={cfg.reloadHours}
              a={{
                patch: p => patch(acc.id, p),
                activate: () => setActiveId(acc.id),
                fullscreen: () => setFullId(f => (f === acc.id ? null : acc.id)),
                edit: () => setDialog({ kind: 'account', id: acc.id }),
                remove: () => void removeAccount(acc),
                recycle: () => setGen(g => ({ ...g, [acc.id]: (g[acc.id] ?? 0) + 1 })),
                dragStart: () => (dragId.current = acc.id),
                dragEnd: () => (dragId.current = null),
                canDrop: () => !!dragId.current && dragId.current !== acc.id,
                drop: () => dragId.current && moveAccount(dragId.current, acc.id)
              }}
            />
          );
        })}
      </main>

      {dialog?.kind === 'account' && (
        <AccountDialog
          acc={editing}
          defaultName={`Conta ${total + 1}`}
          defaultUrl={cfg.accounts[total - 1]?.url ?? ''}
          onSave={v => saveAccount(dialog.id, v)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'settings' && <SettingsDialog cfg={cfg} setCfg={setCfg} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'search' && (
        <SearchDialog
          accounts={cfg.accounts}
          visible={visible}
          onPick={i => {
            focusAccount(i);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
