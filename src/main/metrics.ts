import { app, ipcMain } from 'electron';
import { IPC } from '../shared/ipc';

export function registerMetricsIpc() {
  ipcMain.handle(IPC.RAM, () => {
    const kb = app.getAppMetrics().reduce((sum, m) => sum + (m.memory?.workingSetSize || 0), 0);
    return Math.round(kb / 1024);
  });
}