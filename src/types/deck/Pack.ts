import type { ChordSpec } from "../midi/Song";

export const STEPS_PER_BAR = 16;

export const ROW_ROLES = [
  "drums", "percussion", "fx",
  "bass", "arp",
  "chords", "keys", "guitar", "pad", "lead", "vocal",
] as const;
export type RowRole = typeof ROW_ROLES[number];

export type CellBars = 1 | 2 | 4;

/** How a pitched row's degrees resolve (spec §1, harmonic spine).
 *  - "chord": degree 0 = root of the spine chord sounding at that moment.
 *    Riffs, basslines and voicings follow the progression by construction.
 *  - "key":   degree 0 = tonic. Melodies keep their authored contour. */
export type HarmonyMode = "chord" | "key";

/** A pitched note. `deg` is a scale step (may be negative or > 6), never a MIDI pitch. */
export interface PatternNote {
  step: number;  // 0-based 16th step within the cell
  dur: number;   // in steps
  deg: number;
  v: number;     // velocity 0–1
}

/** A drum hit. GM note numbers so drums land on the right lanes in any DAW (spec §5). */
export interface DrumHit {
  step: number;
  note: number;
  v: number;
}

interface CellBase {
  id: string;
  bars: CellBars;
}

export interface PitchedCell extends CellBase {
  type: "pattern";
  notes: PatternNote[];
}

export interface DrumCell extends CellBase {
  type: "pattern";
  hits: DrumHit[];
}

export interface PitchedRow {
  kind: "pitched";
  id: string;
  name: string;
  role: RowRole;
  harmony: HarmonyMode;
  octave: number;                 // octave of degree 0; C4 = 60
  cells: PitchedCell[];           // index = energy column, sparse → full
}

export interface DrumRow {
  kind: "drums";
  id: string;
  name: string;
  role: RowRole;
  cells: DrumCell[];
}

export type Row = PitchedRow | DrumRow;
export type Cell = PitchedCell | DrumCell;

export interface Pack {
  id: string;
  title: string;
  genre: string;
  key: string;          // e.g. "A minor"
  bpm: number;
  spine: ChordSpec[];   // one chord per bar, loops at its own length
  rows: Row[];
}
