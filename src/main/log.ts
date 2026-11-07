import { appendFileSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';

const MAX_BYTES = 1_000_000;
const CHECK_EVERY = 50;
let writes = 0;

export const file = () => join(app.getPath('userData'), 'quad-idle.log');

function text(a: unknown) {
  if (a instanceof Error) return a.stack;
  if (typeof a === 'string') return a;
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

function write(level: string, args: unknown[]) {
  try {
    const f = file();
    if (writes++ % CHECK_EVERY === 0) {
      try {
        if (statSync(f).size > MAX_BYTES) renameSync(f, f + '.old');
      } catch {
        // no file yet
      }
    }
    appendFileSync(f, `${new Date().toISOString()} ${level} ${args.map(text).join(' ')}\n`);
  } catch {
    // logging must never crash the app
  }
}

export const info = (...a: unknown[]) => write('INFO', a);
export const warn = (...a: unknown[]) => write('WARN', a);
export const error = (...a: unknown[]) => write('ERROR', a);
