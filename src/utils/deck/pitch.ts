import type { ChordSpec } from "../../types/midi/Song";
import { STEPS_PER_BAR, type Pack, type PitchedRow } from "../../types/deck/Pack";
import { degreeToSemitone, parseKeyMode, parseKeyRoot } from "../midi/scale";

export interface KeyContext {
  rootPc: number;
  mode: "major" | "minor";
}

export function keyContext(pack: Pack): KeyContext {
  return { rootPc: parseKeyRoot(pack.key), mode: parseKeyMode(pack.key) };
}

/** Spine chord at a cycle position. Harmony is phase-locked to the transport
 *  even though pattern rhythm is free-phase, so a 2-bar riff launched on bar 3
 *  still lands on bar 3's chord. */
export function spineChordAt(spine: ChordSpec[], cycleStep: number): ChordSpec | undefined {
  if (!spine.length) return undefined;
  return spine[Math.floor(cycleStep / STEPS_PER_BAR) % spine.length];
}

/** Chord roots above the 4th degree are taken from below, so progressions
 *  move by small steps instead of climbing toward the next octave. */
function nearestRootDegree(degree: number): number {
  return degree <= 3 ? degree : degree - 7;
}

export function resolvePitch(
  row: PitchedRow,
  deg: number,
  key: KeyContext,
  chord: ChordSpec | undefined,
): number {
  const keyDegree = row.harmony === "chord" && chord ? nearestRootDegree(chord.degree) + deg : deg;
  return 12 * (row.octave + 1) + key.rootPc + degreeToSemitone(key.mode, keyDegree);
}
