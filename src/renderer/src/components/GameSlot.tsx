import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Account } from '../../../shared/ipc';

interface Props {
  acc: Account;
  url: string;
  hidden: boolean;
  covered: boolean;
  reload: number;
  focusTick: number;
  hours: number;
  delay: number;
  onFocus: () => void;
  onRecycle: () => void;
}

export default function GameSlot(props: Props) {
  const { acc, url, hidden, covered, reload, focusTick, hours, delay } = props;
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ ...props, shown: true });
  const attempts = useRef(0);
  const retryTimer = useRef(0);
  const okTimer = useRef(0);
  const lastSent = useRef('');
  const [snap, setSnap] = useState('');
  const [nativeHidden, setNativeHidden] = useState(false);

  const push = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const item = {
      id: latest.current.acc.id,
      rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      visible: latest.current.shown && r.width > 0 && r.height > 0
    };
    const key = JSON.stringify(item);
    if (key === lastSent.current) return;
    lastSent.current = key;
    window.api.gameLayout([item]);
  }, []);

  const open = useCallback(() => {
    const { acc: a, url: u } = latest.current;
    if (!u) return;
    void window.api.gameOpen(a.id, u, a.muted, a.zoom);
    lastSent.current = '';
    push();
  }, [push]);

  const retry = useCallback(() => {
    if (retryTimer.current) return;
    clearTimeout(okTimer.current);
    const wait = Math.min(120, 10 * 2 ** attempts.current++) * 1000;
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = 0;
      open();
      okTimer.current = window.setTimeout(() => (attempts.current = 0), 20000);
    }, wait);
  }, [open]);

  useLayoutEffect(() => {
    latest.current = { ...props, shown: !nativeHidden && !hidden };
  });
  useLayoutEffect(push);

  useEffect(() => {
    const ro = new ResizeObserver(push);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('resize', push);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', push);
    };
  }, [push]);

  useEffect(() => {
    attempts.current = 0;
    clearTimeout(retryTimer.current);
    retryTimer.current = 0;
    open();
  }, [open, url, reload]);

  useEffect(() => {
    const id = acc.id;
    return () => {
      clearTimeout(retryTimer.current);
      clearTimeout(okTimer.current);
      void window.api.gameDestroy(id);
    };
  }, [acc.id]);

  useEffect(() => {
    void window.api.gameSet(acc.id, acc.muted, acc.zoom);
  }, [acc.id, acc.muted, acc.zoom]);

  useEffect(() => {
    if (focusTick) void window.api.gameFocus(acc.id);
  }, [focusTick, acc.id]);

  useEffect(
    () =>
      window.api.onGameEvent((id, type) => {
        if (id !== acc.id) return;
        if (type === 'focus') latest.current.onFocus();
        else retry();
      }),
    [acc.id, retry]
  );

  useEffect(() => {
    if (!hours) return;
    const t = setTimeout(() => latest.current.onRecycle(), hours * 3600 * 1000 + delay);
    return () => clearTimeout(t);
  }, [hours, delay]);

  useEffect(() => {
    if (!covered || hidden) {
      setSnap('');
      setNativeHidden(false);
      return;
    }
    let alive = true;
    window.api
      .gameSnapshot(acc.id)
      .catch(() => '')
      .then(s => {
        if (!alive) return;
        setSnap(s);
        setNativeHidden(true);
      });
    return () => {
      alive = false;
    };
  }, [covered, hidden, acc.id]);

  return <div ref={ref} className="flex min-h-0 flex-1" style={snap ? { backgroundImage: `url(${snap})` } : undefined} />;
}
