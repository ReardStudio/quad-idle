import { useState, type MouseEvent } from 'react';
import type { Account } from '../../../shared/ipc';
import { cx } from '../lib/utils';
import GameSlot from './GameSlot';

export interface PanelActions {
  patch: (p: Partial<Account>) => void;
  activate: () => void;
  fullscreen: () => void;
  edit: () => void;
  remove: () => void;
  recycle: () => void;
  dragStart: () => void;
  dragEnd: () => void;
  canDrop: () => boolean;
  drop: () => void;
}

interface Props {
  acc: Account;
  order: number;
  onScreen: boolean;
  mountGame: boolean;
  fullscreen: boolean;
  hiddenByFullscreen: boolean;
  active: boolean;
  covered: boolean;
  reload: number;
  gen: number;
  focusTick: number;
  reloadHours: number;
  index: number;
  a: PanelActions;
}

const BTN = 'px-1.5 py-0.5';
const IDLE = 'bg-transparent text-muted hover:bg-hover hover:text-fg';
const DANGER = 'bg-transparent text-muted hover:bg-bad hover:text-white';

const RARE =
  'pointer-events-none opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100';

export default function Panel(p: Props) {
  const { acc, a } = p;
  const [dropTarget, setDropTarget] = useState(false);
  const [localReload, setLocalReload] = useState(0);

  const onHeadDoubleClick = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('input,button')) a.fullscreen();
  };
  const zoom = (d: number) => a.patch({ zoom: Math.min(2, Math.max(0.4, Math.round((acc.zoom + d) * 10) / 10)) });

  return (
    <div
      className={cx(
        'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border-2 bg-black',
        p.active ? 'border-accent' : 'border-transparent',
        !p.onScreen && !p.fullscreen && 'absolute left-[-10000px] top-0 h-150 w-225',
        p.fullscreen && 'absolute inset-0 z-20',
        p.hiddenByFullscreen && 'invisible'
      )}
      style={{ order: p.order }}
      onMouseEnter={a.activate}
    >
      <div
        className={cx('group flex select-none flex-wrap items-center gap-0.5 bg-card px-1.5 py-1', dropTarget && 'outline-2 -outline-offset-2 outline-accent')}
        onDoubleClick={onHeadDoubleClick}
        onDragOver={e => {
          if (!a.canDrop()) return;
          e.preventDefault();
          setDropTarget(true);
        }}
        onDragLeave={() => setDropTarget(false)}
        onDrop={e => {
          e.preventDefault();
          setDropTarget(false);
          a.drop();
        }}
      >
        <span
          className="cursor-grab px-1 text-muted hover:text-fg"
          draggable
          title="Arraste para reordenar"
          onDragStart={e => {
            a.dragStart();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', acc.id);
          }}
          onDragEnd={a.dragEnd}
        >
          ⠿
        </span>
        <input
          className="w-30 border-transparent bg-transparent px-1.25 py-0.5 font-semibold hover:border-line hover:bg-[#0e1014] focus:border-accent focus:bg-[#0e1014] focus:outline-none"
          maxLength={20}
          title="Clique para renomear"
          aria-label="Nome da conta"
          value={acc.name}
          onChange={e => a.patch({ name: e.target.value })}
        />
        <span className="flex-1" />
        <button className={cx(BTN, IDLE)} title="Silenciar / ativar som" onClick={() => a.patch({ muted: !acc.muted })}>
          {acc.muted ? '🔇' : '🔊'}
        </button>
        <button className={cx(BTN, IDLE)} title="Recarregar" onClick={() => setLocalReload(n => n + 1)}>
          🔄
        </button>
        <button className={cx(BTN, IDLE, RARE)} title="Diminuir zoom" onClick={() => zoom(-0.1)}>
          −
        </button>
        <span className={cx('min-w-9.5 text-center text-muted', RARE)}>{Math.round(acc.zoom * 100)}%</span>
        <button className={cx(BTN, IDLE, RARE)} title="Aumentar zoom" onClick={() => zoom(0.1)}>
          +
        </button>
        <button className={cx(BTN, IDLE)} title="Tela cheia (ou duplo clique na barra)" onClick={a.fullscreen}>
          ⛶
        </button>
        <button className={cx(BTN, IDLE, RARE)} title="Editar nome / link" onClick={a.edit}>
          ✎
        </button>
        <button className={cx(BTN, DANGER, RARE)} title="Apagar esta conta" onClick={a.remove}>
          🗑
        </button>
      </div>
      {p.mountGame && (
        <GameSlot
          key={p.gen}
          acc={acc}
          url={acc.url}
          hidden={p.hiddenByFullscreen}
          covered={p.covered}
          reload={p.reload + localReload}
          focusTick={p.focusTick}
          hours={p.reloadHours}
          delay={p.index * 60000}
          onFocus={a.activate}
          onRecycle={a.recycle}
        />
      )}
    </div>
  );
}
