import { join } from 'node:path';
import { app, BrowserWindow, Menu, nativeImage, ipcMain, shell, Tray } from 'electron';
import { IPC } from '../shared/ipc';

const ASSETS = join(__dirname, '../../assets');

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let useTray = false;

export const getWindow = () => win;

export function send(channel: string, ...args: unknown[]) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, ...args);
}

export function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function setTray(on: boolean) {
  useTray = on;
  if (on && !tray) {
    tray = new Tray(nativeImage.createFromPath(join(ASSETS, 'icon.png')).resize({ width: 16, height: 16 }));
    tray.setToolTip('Quad Idle');
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Abrir', click: showWindow },
        { label: 'Sair', click: () => app.quit() }
      ])
    );
    tray.on('click', showWindow);
  } else if (!on && tray) {
    tray.destroy();
    tray = null;
  }
}

export function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f1115',
    icon: join(ASSETS, 'icon.png'),
    title: 'Quad Idle',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#1a1d23', symbolColor: '#e8eaef', height: 44 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  win.removeMenu();
  if (process.env['ELECTRON_RENDERER_URL']) win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  else win.loadFile(join(__dirname, '../renderer/index.html'));
  if (!app.isPackaged) {
    win.setTitle('Quad Idle (DEV)');
    win.on('page-title-updated', e => e.preventDefault());
    win.webContents.openDevTools({ mode: 'detach' });
  }
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('minimize', () => {
    if (useTray) win?.hide();
  });
  win.on('closed', () => {
    win = null;
    app.quit();
  });
}

let lastPopup = 0;
export function guardContents() {
  app.on('web-contents-created', (_e, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url) && Date.now() - lastPopup > 3000) {
        lastPopup = Date.now();
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown' || input.alt || input.shift) return;
      if (input.key === 'Escape' && !input.control) return send(IPC.SHORTCUT, 'escape');
      if (!input.control) return;
      if (input.key.toLowerCase() === 'k') {
        event.preventDefault();
        win?.webContents.focus();
        return send(IPC.SHORTCUT, 'search');
      }
      if (!/^[1-9]$/.test(input.key)) return;
      event.preventDefault();
      send(IPC.SHORTCUT, Number(input.key));
    });
  });
}

export function registerWindowIpc() {
  ipcMain.handle(IPC.WINDOW_ALWAYS_ON_TOP, (_e, v: boolean) => win?.setAlwaysOnTop(!!v));
  ipcMain.handle(IPC.WINDOW_TRAY, (_e, v: boolean) => setTray(!!v));
}
