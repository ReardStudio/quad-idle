import type { Account } from '../../../shared/ipc';

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const fmt = (n: number) => n.toLocaleString('pt-BR');
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function normalizeUrl(u: string) {
  u = (u || '').trim();
  return !u ? '' : /^https?:\/\//i.test(u) ? u : 'https://' + u;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const newAccount = (o: Partial<Account> = {}): Account => ({ id: newId(), name: 'Conta', url: '', zoom: 1, muted: false, ...o });

export const screenCount = (perScreen: number, total: number) => (perScreen === 0 ? total : Math.min(perScreen, total));

export const visibleStart = (total: number, shown: number, focus: number) => Math.max(0, Math.min(focus, total - shown));

export function visibleIds(accounts: Account[], perScreen: number, focus: number): string[] {
  const n = accounts.length;
  if (!n) return [];
  const q = screenCount(perScreen, n);
  const start = visibleStart(n, q, focus);
  return accounts.slice(start, start + q).map(a => a.id);
}

export function nextPage(total: number, shown: number, focus: number, dir: 1 | -1) {
  const start = visibleStart(total, shown, focus);
  const last = Math.max(0, total - shown);
  if (dir > 0) return start >= last ? 0 : Math.min(start + shown, last);
  return start <= 0 ? last : Math.max(start - shown, 0);
}

export function gridShape(visible: number) {
  const v = Math.max(1, visible);
  const cols = v <= 1 ? 1 : v <= 4 ? 2 : v <= 9 ? 3 : 4;
  return { cols, rows: Math.ceil(v / cols) };
}