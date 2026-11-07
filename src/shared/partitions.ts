const GAME = 'conta';

export const gamePartition = (id: string) => `persist:${GAME}${id}`;

export function orphanDirs(dirNames: string[], accountIds: string[]): string[] {
  const keep = new Set(accountIds.map(id => id.toLowerCase()));
  return dirNames.filter(name => {
    const n = name.toLowerCase();
    return n.startsWith(GAME) && n.length > GAME.length && !keep.has(n.slice(GAME.length));
  });
}