import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app, ipcMain } from 'electron';
import { IPC, type Config } from '../shared/ipc';
import { normalizeConfig } from './config-schema';
import * as log from './log';

const cfgFile = () => join(app.getPath('userData'), 'config.json');

export function readSaved(): Partial<Config> | null {
  try {
    return JSON.parse(readFileSync(cfgFile(), 'utf8'));
  } catch {
    return null;
  }
}

let pending: string | null = null;
let timer: NodeJS.Timeout | undefined;

function flush() {
  if (pending === null) return;
  try {
    writeFileSync(cfgFile() + '.tmp', pending);
    renameSync(cfgFile() + '.tmp', cfgFile());
  } catch (e) {
    log.error('save config', e);
  }
  pending = null;
}

export function registerConfigIpc() {
  ipcMain.on(IPC.CFG_GET, e => {
    e.returnValue = normalizeConfig(readSaved() ?? {});
  });
  ipcMain.on(IPC.CFG_SET, (_e, cfg: Config) => {
    pending = JSON.stringify(cfg);
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  });
  app.on('before-quit', flush);
}
