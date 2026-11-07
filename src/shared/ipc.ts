export const IPC = {
  GAME_OPEN: 'game:open',
  GAME_SET: 'game:set',
  GAME_FOCUS: 'game:focus',
  GAME_DESTROY: 'game:destroy',
  GAME_LAYOUT: 'game:layout',
  GAME_EVENT: 'game:event',
  GAME_SNAPSHOT: 'game:snapshot',
  RAM: 'ram',
  WINDOW_ALWAYS_ON_TOP: 'window:alwaysOnTop',
  WINDOW_TRAY: 'window:tray',
  SYSTEM_KEEP_AWAKE: 'system:keepAwake',
  SYSTEM_AUTOSTART: 'system:autostart',
  SHORTCUT: 'shortcut',
  NETWORK: 'network',
  LOG: 'log',
  LOG_OPEN: 'logs:open',
  CFG_GET: 'cfg:get',
  CFG_SET: 'cfg:set',
  ACCOUNT_REMOVE: 'account:remove',
  UPDATE_VERSION: 'update:version',
  UPDATE_CHECK: 'update:check',
  UPDATE_GET_READY: 'update:getReady',
  UPDATE_INSTALL: 'update:install',
  UPDATE_DOWNLOADED: 'update:downloaded'
} as const;

export interface Account {
  id: string;
  name: string;
  url: string;
  zoom: number;
  muted: boolean;
}

export interface Config {
  accounts: Account[];
  perScreen: number;
  focus: number;
  alwaysOnTop: boolean;
  tray: boolean;
  ramLimit: number;
  suspendHidden: boolean;
  reloadHours: number;
  keepAwake: boolean;
  startWithWindows: boolean;
}

export type GameEvent = 'focus' | 'fail' | 'crashed';

export type Shortcut = number | 'escape' | 'search';

export interface LayoutItem {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
  visible: boolean;
}

export interface Api {
  ramMb(): Promise<number>;
  gameOpen(id: string, url: string, muted: boolean, zoom: number): Promise<void>;
  gameSet(id: string, muted: boolean, zoom: number): Promise<void>;
  gameFocus(id: string): Promise<void>;
  gameDestroy(id: string): Promise<void>;
  gameLayout(list: LayoutItem[]): void;
  gameSnapshot(id: string): Promise<string>;
  onGameEvent(cb: (id: string, type: GameEvent) => void): () => void;
  setAlwaysOnTop(v: boolean): Promise<void>;
  setTray(v: boolean): Promise<void>;
  setKeepAwake(v: boolean): Promise<void>;
  setAutostart(v: boolean): Promise<void>;
  openLog(): Promise<void>;
  log(level: 'info' | 'warn' | 'error', ...args: string[]): void;
  onShortcut(cb: (s: Shortcut) => void): () => void;
  readConfig(): Config;
  writeConfig(cfg: Config): void;
  removeAccount(id: string): Promise<void>;
  getVersion(): Promise<string>;
  checkUpdate(): Promise<string>;
  getReadyUpdate(): Promise<string | null>;
  installUpdate(): Promise<void>;
  onUpdate(cb: (v: string) => void): () => void;
}