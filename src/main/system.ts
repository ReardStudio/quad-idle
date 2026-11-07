import { app, ipcMain, powerSaveBlocker, shell } from 'electron';
import { IPC } from '../shared/ipc';
import * as log from './log';

let sleepBlocker: number | null = null;

export function registerSystemIpc() {
  ipcMain.handle(IPC.SYSTEM_KEEP_AWAKE, (_e, on: boolean) => {
    if (on && sleepBlocker === null) sleepBlocker = powerSaveBlocker.start('prevent-app-suspension');
    else if (!on && sleepBlocker !== null) {
      powerSaveBlocker.stop(sleepBlocker);
      sleepBlocker = null;
    }
  });
  ipcMain.handle(IPC.SYSTEM_AUTOSTART, (_e, on: boolean) => {
    if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!on });
  });
  ipcMain.handle(IPC.LOG_OPEN, () => shell.showItemInFolder(log.file()));
  ipcMain.on(IPC.LOG, (_e, level: 'info' | 'warn' | 'error', ...args: unknown[]) =>
    log[level === 'warn' || level === 'info' ? level : 'error']('[web]', ...args)
  );
}
