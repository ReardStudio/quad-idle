import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { app, ipcMain, session } from 'electron';
import { IPC } from '../shared/ipc';
import { gamePartition, orphanDirs } from '../shared/partitions';
import { safeId } from '../shared/validate';
import { readSaved } from './config-store';
import * as log from './log';

const ready = new Set<string>();

export function setupSession(id: string) {
  const partition = gamePartition(id);
  if (ready.has(partition)) return;
  ready.add(partition);
  const ses = session.fromPartition(partition);
  ses.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  ses.setPermissionCheckHandler(() => false);
}

export function cleanOrphanPartitions() {
  const accounts = readSaved()?.accounts;
  if (!Array.isArray(accounts)) return;
  const dir = join(app.getPath('userData'), 'Partitions');
  if (!existsSync(dir)) return; 
  try {
    for (const d of orphanDirs(readdirSync(dir), accounts.map(a => safeId(a.id)))) rmSync(join(dir, d), { recursive: true, force: true });
  } catch (e) {
    log.error('clean partitions', (e as Error).message);
  }
}

export function registerSessionIpc() {
  ipcMain.handle(IPC.ACCOUNT_REMOVE, async (_e, rawId: string) => {
    const partition = gamePartition(safeId(rawId));
    try {
      const s = session.fromPartition(partition);
      await s.clearStorageData();
      await s.clearCache();
    } catch (e) {
      log.error('clear account', partition, (e as Error).message);
    }
    ready.delete(partition);
  });
}