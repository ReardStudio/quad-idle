import { useEffect, useState } from 'react';

export function useRam() {
  const [ram, setRam] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = () =>
      window.api
        .ramMb()
        .then(v => alive && setRam(v))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return ram;
}