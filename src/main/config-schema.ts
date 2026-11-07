import type { Account, Config } from '../shared/ipc';

const ACCOUNT_DEFAULTS: Omit<Account, 'id'> = { name: 'Conta', url: '', zoom: 1, muted: false };

export function normalizeConfig(s: Partial<Config> = {}): Config {
  return {
    accounts: Array.isArray(s.accounts) ? s.accounts.map(a => ({ ...ACCOUNT_DEFAULTS, ...a })) : [{ ...ACCOUNT_DEFAULTS, id: '1', name: 'Conta 1' }],
    perScreen: s.perScreen ?? 4,
    focus: s.focus ?? 0,
    alwaysOnTop: !!s.alwaysOnTop,
    tray: !!s.tray,
    ramLimit: s.ramLimit || 3000,
    suspendHidden: s.suspendHidden !== false,
    reloadHours: s.reloadHours ?? 8,
    keepAwake: s.keepAwake !== false,
    startWithWindows: !!s.startWithWindows
  };
}
