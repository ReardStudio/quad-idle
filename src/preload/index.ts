import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type Api } from '../shared/ipc';

const invoke = (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args);

function on<A extends unknown[]>(channel: string, cb: (...args: A) => void) {
  const handler = (_e: unknown, ...args: unknown[]) => cb(...(args as A));
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const api: Api = {
  ramMb: () => invoke(IPC.RAM),
  gameOpen: (id, url, muted, zoom) => invoke(IPC.GAME_OPEN, id, url, muted, zoom),
  gameSet: (id, muted, zoom) => invoke(IPC.GAME_SET, id, muted, zoom),
  gameFocus: id => invoke(IPC.GAME_FOCUS, id),
  gameDestroy: id => invoke(IPC.GAME_DESTROY, id),
  gameLayout: list => ipcRenderer.send(IPC.GAME_LAYOUT, list),
  gameSnapshot: id => invoke(IPC.GAME_SNAPSHOT, id),
  onGameEvent: cb => on(IPC.GAME_EVENT, cb),
  setAlwaysOnTop: v => invoke(IPC.WINDOW_ALWAYS_ON_TOP, v),
  setTray: v => invoke(IPC.WINDOW_TRAY, v),
  setKeepAwake: v => invoke(IPC.SYSTEM_KEEP_AWAKE, !!v),
  setAutostart: v => invoke(IPC.SYSTEM_AUTOSTART, !!v),
  openLog: () => invoke(IPC.LOG_OPEN),
  log: (level, ...args) => ipcRenderer.send(IPC.LOG, level, ...args),
  onShortcut: cb => on(IPC.SHORTCUT, cb),
  readConfig: () => ipcRenderer.sendSync(IPC.CFG_GET),
  writeConfig: cfg => ipcRenderer.send(IPC.CFG_SET, cfg),
  removeAccount: id => invoke(IPC.ACCOUNT_REMOVE, id),
  getVersion: () => invoke(IPC.UPDATE_VERSION),
  checkUpdate: () => invoke(IPC.UPDATE_CHECK),
  getReadyUpdate: () => invoke(IPC.UPDATE_GET_READY),
  installUpdate: () => invoke(IPC.UPDATE_INSTALL),
  onUpdate: cb => on(IPC.UPDATE_DOWNLOADED, cb)
};

contextBridge.exposeInMainWorld('api', api);
