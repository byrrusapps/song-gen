
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Pads/truncates a per-bar curve to exactly `bars` entries — the composer
 *  pass frequently gets array length slightly wrong, so callers should always
 *  route presence/intensity through this before using them. */
export function normalizeCurve(curve: number[] | undefined, bars: number, fallback = 1): number[] {
  const src = curve && curve.length ? curve : [fallback];
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const v = src[Math.min(i, src.length - 1)];
    out.push(clamp01(typeof v === "number" && Number.isFinite(v) ? v : fallback));
  }
  return out;
}

/** Thins a set of events by presence, keeping the highest-velocity ones first
 *  so a pattern degrades gracefully as presence drops toward 0 rather than
 *  clipping randomly or cutting out all at once. */
export function thinByPresence<T extends { velocity?: number }>(events: T[], presence: number): T[] {
  if (presence >= 0.999) return events;
  if (presence <= 0.001) return [];
  const sorted = [...events].sort((a, b) => (b.velocity ?? 0.8) - (a.velocity ?? 0.8));
  const keepCount = Math.max(1, Math.round(sorted.length * presence));
  const kept = new Set(sorted.slice(0, keepCount));
  return events.filter((e) => kept.has(e));
}

export function intensityToVelocityScale(intensity: number): number {
  return 0.5 + clamp01(intensity) * 0.65; // 0.5x–1.15x velocity multiplier
}