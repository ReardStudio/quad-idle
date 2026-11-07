import { ipcMain, WebContentsView } from 'electron';
import { IPC, type GameEvent, type LayoutItem } from '../shared/ipc';
import { gamePartition } from '../shared/partitions';
import { safeId, sanitizeRect } from '../shared/validate';
import * as log from './log';
import { setupSession } from './sessions';
import { getWindow, send } from './window';

interface Game {
  view: WebContentsView;
  muted: boolean;
  zoom: number;
  hung: NodeJS.Timeout | undefined;
}
const views = new Map<string, Game>();

function applyGame(g: Game, muted: unknown, zoom: unknown) {
  g.muted = !!muted;
  g.zoom = Number(zoom) || 1;
  g.view.webContents.setAudioMuted(g.muted);
  g.view.webContents.setZoomFactor(g.zoom);
}

function gameView(id: string): Game {
  const existing = views.get(id);
  if (existing) return existing;
  const win = getWindow();
  if (!win) throw new Error('no window');

  setupSession(id);
  const view = new WebContentsView({
    webPreferences: { partition: gamePartition(id), backgroundThrottling: false, sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  view.setBorderRadius(6);
  const wc = view.webContents;
  const g: Game = { view, muted: false, zoom: 1, hung: undefined };
  const emit = (type: GameEvent) => send(IPC.GAME_EVENT, id, type);

  wc.on('render-process-gone', (_e, d) => {
    log.error('render gone', id, d.reason, d.exitCode);
    emit('crashed');
  });
  wc.on('unresponsive', () => {
    log.error('unresponsive', id);
    g.hung = setTimeout(() => wc.forcefullyCrashRenderer(), 60000);
  });
  wc.on('responsive', () => clearTimeout(g.hung));
  wc.on('dom-ready', () => applyGame(g, g.muted, g.zoom));
  wc.on('did-fail-load', (_e, code, _d, _u, isMainFrame) => {
    if (isMainFrame && code !== -3) emit('fail');
  });

  wc.on('input-event', (_e, i) => {
    if (i.type !== 'mouseDown') return;
    emit('focus');
  });

  win.contentView.addChildView(view);
  views.set(id, g);
  return g;
}

function destroyGame(id: string) {
  const g = views.get(id);
  if (!g) return;
  clearTimeout(g.hung);
  views.delete(id);
  getWindow()?.contentView.removeChildView(g.view);
  g.view.webContents.close();
}

export function registerGameIpc() {
  ipcMain.handle(IPC.GAME_OPEN, (_e, id: string, url: string, muted: boolean, zoom: number) => {
    if (!/^https?:\/\//i.test(String(url))) return;
    const g = gameView(safeId(id));
    applyGame(g, muted, zoom);
    return g.view.webContents.loadURL(url).catch(() => {});
  });
  ipcMain.handle(IPC.GAME_SET, (_e, id: string, muted: boolean, zoom: number) => {
    const g = views.get(safeId(id));
    if (g) applyGame(g, muted, zoom);
  });
  ipcMain.handle(IPC.GAME_FOCUS, (_e, id: string) => views.get(safeId(id))?.view.webContents.focus());
  ipcMain.handle(IPC.GAME_DESTROY, (_e, id: string) => destroyGame(safeId(id)));
  ipcMain.on(IPC.GAME_LAYOUT, (_e, list: LayoutItem[]) => {
    if (!Array.isArray(list)) return;
    for (const { id, rect, visible } of list) {
      const g = views.get(safeId(id));
      if (!g) continue;
      g.view.setBounds(sanitizeRect(rect));
      g.view.setVisible(!!visible);
    }
  });
  ipcMain.handle(IPC.GAME_SNAPSHOT, async (_e, id: string) => {
    const wc = views.get(safeId(id))?.view.webContents;
    const img = wc && (await wc.capturePage());
    return img && !img.isEmpty() ? 'data:image/jpeg;base64,' + img.toJPEG(70).toString('base64') : '';
  });
}
