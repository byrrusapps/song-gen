import type { ChordQuality } from "../../types/midi/Song";

export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj:   [0, 4, 7],
  min:   [0, 3, 7],
  dim:   [0, 3, 6],
  aug:   [0, 4, 8],
  sus2:  [0, 2, 7],
  sus4:  [0, 5, 7],
  six:   [0, 4, 7, 9],
  min6:  [0, 3, 7, 9],
  maj7:  [0, 4, 7, 11],
  min7:  [0, 3, 7, 10],
  dom7:  [0, 4, 7, 10],
  maj9:  [0, 4, 7, 11, 14],
  min9:  [0, 3, 7, 10, 14],
  dom9:  [0, 4, 7, 10, 14],
  min11: [0, 3, 7, 10, 14, 17],
};

/** When a track's voiceLimit forces us to drop notes, drop from the back of
 *  this ranking. The 5th goes first (it adds least harmonic information),
 *  the quality-defining 3rd/sus and the 7th are kept longest. */
const KEEP_RANK: Record<number, number> = {
  0: 1,   // root
  3: 0, 4: 0, 2: 0, 5: 0, // 3rd or sus tone — defines the chord
  10: 2, 11: 2, 9: 2,     // 7th / 6th — colour
  14: 3, 17: 4,           // 9th / 11th — extension
  7: 5, 6: 5, 8: 5,       // 5th — drop first
};

export function limitVoices(intervals: number[], voiceLimit: number): number[] {
  if (voiceLimit >= intervals.length) return [...intervals];
  return [...intervals]
    .sort((a, b) => (KEEP_RANK[a] ?? 6) - (KEEP_RANK[b] ?? 6))
    .slice(0, Math.max(1, voiceLimit))
    .sort((a, b) => a - b);
}