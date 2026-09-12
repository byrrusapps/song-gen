import type { ChordSpec, Register } from "../../types/midi/Song";
import { CHORD_INTERVALS, limitVoices } from "../../config/midi/chord";
import { degreeToSemitone } from "./scale";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Absolute MIDI pitch of a chord's root, before voicing. */
export function chordRootMidi(
  chord: ChordSpec,
  keyRootPc: number,
  mode: "major" | "minor",
  transpose: number
): number {
  return 60 + keyRootPc + degreeToSemitone(mode, chord.degree) + transpose;
}

/**
 * Builds a voice-led chord: each pitch class is placed in the octave nearest
 * the previous voicing, so successive chords move by small intervals instead
 * of jumping around the register. This is what makes progressions sound
 * played rather than looked up.
 */
export function voiceChord(
  chord: ChordSpec,
  opts: {
    keyRootPc: number;
    mode: "major" | "minor";
    transpose: number;
    register: Register;
    voiceLimit: number;
    previous?: number[];
  }
): number[] {
  const { keyRootPc, mode, transpose, register, voiceLimit, previous } = opts;
  const rootMidi = chordRootMidi(chord, keyRootPc, mode, transpose);
  const intervals = limitVoices(CHORD_INTERVALS[chord.quality] ?? CHORD_INTERVALS.min7, voiceLimit);

  const center = (register.min + register.max) / 2;
  const anchors = previous?.length ? previous : [center];

  const voiced = intervals.map((interval, i) => {
    const pc = (rootMidi + interval) % 12;
    const anchor = anchors[Math.min(i, anchors.length - 1)];

    // Try every octave in range, keep the placement closest to the anchor.
    let best = rootMidi + interval;
    let bestDist = Infinity;
    for (let oct = -2; oct <= 8; oct++) {
      const candidate = pc + oct * 12;
      if (candidate < register.min || candidate > register.max) continue;
      const dist = Math.abs(candidate - anchor);
      if (dist < bestDist) { bestDist = dist; best = candidate; }
    }
    return clamp(best, register.min, register.max);
  });

  // Apply inversion by lifting the lowest voices an octave where it fits.
  const sorted = [...new Set(voiced)].sort((a, b) => a - b);
  for (let i = 0; i < (chord.inversion ?? 0) && i < sorted.length; i++) {
    const lifted = sorted[0] + 12;
    if (lifted <= register.max) { sorted.shift(); sorted.push(lifted); sorted.sort((a, b) => a - b); }
  }

  // Slash bass: add the specified degree below the voicing if there's room.
  if (chord.bassDegree !== undefined) {
    const bass = 36 + keyRootPc + degreeToSemitone(mode, chord.bassDegree) + transpose;
    if (bass >= register.min) sorted.unshift(clamp(bass, register.min, register.max));
  }

  return sorted;
}