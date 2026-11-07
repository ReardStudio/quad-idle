import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Account } from '../../../shared/ipc';
import { cx } from '../lib/utils';
import Dialog, { FULL } from './Dialog';

interface Props {
  accounts: Account[];
  visible: string[];
  onPick: (index: number) => void;
  onClose: () => void;
}

export default function SearchDialog({ accounts, visible, onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);

  const term = q.trim().toLowerCase();
  const found = accounts.map((a, i) => ({ a, i })).filter(({ a, i }) => !term || a.name.toLowerCase().includes(term) || String(i + 1) === term);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    selRef.current?.scrollIntoView({ block: 'nearest' });
  }, [sel, q]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(found.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(0, s - 1));
    } else if (e.key === 'Enter' && found[sel]) {
      e.preventDefault();
      onPick(found[sel].i);
    }
  };

  return (
    <Dialog title="Ir para a conta" onClose={onClose}>
      <input
        ref={inputRef}
        className={FULL}
        type="text"
        placeholder="Nome ou número da conta"
        aria-label="Buscar conta"
        value={q}
        onChange={e => {
          setQ(e.target.value);
          setSel(0);
        }}
        onKeyDown={onKey}
      />
      <ul className="mt-2 max-h-72 overflow-auto">
        {found.map(({ a, i }, k) => (
          <li key={a.id}>
            <button
              ref={k === sel ? selRef : undefined}
              className={cx('flex w-full items-center gap-2 text-left', k === sel ? 'bg-hover' : 'bg-transparent')}
              onClick={() => onPick(i)}
            >
              <span className="w-6 text-right tabular-nums text-muted">{i + 1}</span>
              <span className="flex-1 truncate">{a.name}</span>
              {visible.includes(a.id) && <small className="text-muted">na tela</small>}
            </button>
          </li>
        ))}
        {!found.length && <li className="py-2 text-muted">Nenhuma conta com esse nome.</li>}
      </ul>
    </Dialog>
  );
}
