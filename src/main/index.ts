import { join } from 'node:path';
import { app } from 'electron';
import { registerConfigIpc } from './config-store';
import { registerGameIpc } from './game-views';
import * as log from './log';
import { registerMetricsIpc } from './metrics';
import { cleanOrphanPartitions, registerSessionIpc } from './sessions';
import { registerSystemIpc } from './system';
import { initUpdater } from './updater';
import { createWindow, guardContents, registerWindowIpc, showWindow } from './window';

if (!app.isPackaged) app.setPath('userData', join(app.getPath('appData'), 'Quad Idle Dev'));
app.commandLine.appendSwitch('process-per-site'); 

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  process.on('uncaughtException', e => log.error('uncaughtException', e));
  app.on('child-process-gone', (_e, d) => log.error('child gone', d.type, d.reason, d.exitCode));
  app.on('window-all-closed', () => app.quit());

  guardContents();
  app.whenReady().then(() => {
    log.info('start', app.getVersion());
    cleanOrphanPartitions(); 
    registerConfigIpc();
    registerWindowIpc();
    registerGameIpc();
    registerSessionIpc();
    registerMetricsIpc();
    registerSystemIpc();
    createWindow();
    initUpdater();
  });
}
