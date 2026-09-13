// Pure step arithmetic for the deck scheduler. All positions are absolute
// 16th steps since transport start; "cycle position" is that modulo the cycle.
// Kept free of Tone and Solid so it can be tested in plain Node.

const STEPS_PER_BAR = 16;

/** Pack cycle = longest cell in the pack (spec §2). */
export function cycleSteps(cellBars: number[]): number {
  return Math.max(1, ...cellBars) * STEPS_PER_BAR;
}

/** Launch quantum: 25% of the cycle. */
export function quantumSteps(cycle: number): number {
  return cycle / 4;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** First quantum boundary strictly after `after` (the last step already
 *  handed to the audio clock — anything at or before it is too late). */
export function nextBoundary(after: number, quantum: number): number {
  return (Math.floor(after / quantum) + 1) * quantum;
}

/** One-shots land so they *end* on a cycle boundary, then the row reverts.
 *  Returns the start step: the latest start that ends on the next cycle
 *  boundary, or the one after if that start has already passed. */
export function oneShotStart(after: number, cycle: number, cellLen: number): number {
  const start = nextBoundary(after, cycle) - cellLen;
  return start > after ? start : start + cycle;
}

/** Position inside a free-phase cell anchored (its step 0) at `anchor`. */
export function localStep(abs: number, anchor: number, cellLen: number): number {
  return mod(abs - anchor, cellLen);
}

/** Notes sounding at `entry` that began before it, including tails that wrap
 *  across the cell's loop point. They are started at entry with what's left
 *  of their duration so held pads and bass don't leave holes (spec §2). */
export function inFlightAt<N extends { step: number; dur: number }>(
  notes: N[],
  entry: number,
  cellLen: number,
): { note: N; remaining: number }[] {
  const out: { note: N; remaining: number }[] = [];
  for (const note of notes) {
    const elapsed = mod(entry - note.step, cellLen);
    const dur = Math.min(note.dur, cellLen);
    if (elapsed > 0 && elapsed < dur) out.push({ note, remaining: dur - elapsed });
  }
  return out;
}
