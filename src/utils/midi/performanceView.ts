import type { SongComposition, PerformanceIR, NoteEvent } from "../../types/midi/Song";

export interface SectionRange {
  sectionId: string;
  name: string;
  bars: number;
  startBar: number;
  startSeconds: number;
  endSeconds: number;
}

/** Maps each section onto its absolute position in the realized performance,
 *  so the UI can slice notes for whichever section is selected. */
export function sectionRanges(song: SongComposition, performance: PerformanceIR): SectionRange[] {
  const ranges: SectionRange[] = [];
  let startBar = 0;
  for (const section of song.sections) {
    const startSeconds = performance.barStartSeconds[startBar] ?? 0;
    const endSeconds =
      performance.barStartSeconds[startBar + section.bars] ??
      startSeconds + section.bars * (performance.barStartSeconds[1] ?? 2);
    ranges.push({ sectionId: section.id, name: section.name, bars: section.bars, startBar, startSeconds, endSeconds });
    startBar += section.bars;
  }
  return ranges;
}

/** Notes that begin within the window. Durations are left intact — a note
 *  tied past the section boundary is clipped at render time, not here. */
export function sliceNotes(notes: NoteEvent[], startSeconds: number, endSeconds: number): NoteEvent[] {
  return notes.filter((n) => n.time >= startSeconds - 1e-6 && n.time < endSeconds - 1e-6);
}

export function pitchExtent(notes: NoteEvent[], pad = 2): { low: number; high: number } {
  if (!notes.length) return { low: 48, high: 72 };
  let low = Infinity;
  let high = -Infinity;
  for (const n of notes) {
    if (n.midi < low) low = n.midi;
    if (n.midi > high) high = n.midi;
  }
  // Guarantee a minimum visible span so a single-pitch track isn't one fat row.
  if (high - low < 11) {
    const centre = Math.round((low + high) / 2);
    low = centre - 6;
    high = centre + 6;
  }
  return { low: Math.max(0, low - pad), high: Math.min(127, high + pad) };
}