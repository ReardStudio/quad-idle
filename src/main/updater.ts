import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC } from '../shared/ipc';
import * as log from './log';
import { send } from './window';

let readyVersion: string | null = null;

export function initUpdater() {
  ipcMain.handle(IPC.UPDATE_VERSION, () => app.getVersion());
  ipcMain.handle(IPC.UPDATE_GET_READY, () => readyVersion);
  ipcMain.handle(IPC.UPDATE_INSTALL, () => autoUpdater.quitAndInstall(true, true));
  ipcMain.handle(IPC.UPDATE_CHECK, async () => {
    if (!app.isPackaged) return 'Dev mode';
    try {
      const r = await autoUpdater.checkForUpdates();
      return r?.isUpdateAvailable ? 'Downloading ' + r.updateInfo.version : 'latest version';
    } catch (e) {
      return 'Err: ' + (e as Error).message;
    }
  });

  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', info => {
    readyVersion = info.version;
    log.info('update downloaded', info.version);
    send(IPC.UPDATE_DOWNLOADED, info.version);
  });
  autoUpdater.on('error', e => log.error('update', e?.message));

  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 15000);
  setInterval(check, 4 * 3600 * 1000);
}