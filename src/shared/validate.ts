export const safeId = (id: unknown) => String(id || '').replace(/[^a-zA-Z0-9]/g, '');

const int = (v: unknown) => (Number.isFinite(v) ? Math.round(v as number) : 0);

export function sanitizeRect(r: { x?: unknown; y?: unknown; width?: unknown; height?: unknown } | null | undefined) {
  return { x: int(r?.x), y: int(r?.y), width: Math.max(0, int(r?.width)), height: Math.max(0, int(r?.height)) };
}
