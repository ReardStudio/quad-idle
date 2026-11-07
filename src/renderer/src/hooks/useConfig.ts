import { useEffect, useState } from 'react';
import type { Config } from '../../../shared/ipc';
import { clamp } from '../lib/utils';

export function useConfig() {
  const [cfg, setCfg] = useState<Config>(() => {
    const c = window.api.readConfig();
    return { ...c, focus: clamp(c.focus, 0, Math.max(0, c.accounts.length - 1)) };
  });
  useEffect(() => {
    window.api.writeConfig(cfg);
  }, [cfg]);
  return [cfg, setCfg] as const;
}
