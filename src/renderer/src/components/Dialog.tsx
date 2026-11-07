import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { cx } from '../lib/utils';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Dialog({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="m-auto w-110 max-w-[92vw] rounded-xl border border-line bg-card p-4 text-fg backdrop:bg-black/60" onClose={onClose}>
      <h3 className="mb-2 text-[1.17em] font-bold">{title}</h3>
      {children}
    </dialog>
  );
}

interface ToggleProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="my-2 flex cursor-pointer items-center justify-between gap-4">
      <span>
        {label}
        <small className="block text-muted">{hint}</small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 flex-none rounded-full p-0 transition-colors', checked ? 'bg-accent' : 'bg-hover')}
      >
        <span className={cx('absolute top-0.5 size-4 rounded-full bg-white transition-all', checked ? 'left-4.5' : 'left-0.5')} />
      </button>
    </label>
  );
}

export const Label = (p: ComponentProps<'label'>) => <label {...p} className="mb-0.75 mt-2.25 block text-muted" />;
export const Row = (p: ComponentProps<'div'>) => <div {...p} className="my-2 flex items-center gap-3" />;
export const Actions = (p: ComponentProps<'div'>) => <div {...p} className="mt-3.5 flex justify-end gap-2" />;
export const FULL = 'w-full';
export const ROW_BUTTON = 'min-w-[180px] text-left';