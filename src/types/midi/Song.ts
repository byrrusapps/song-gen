export type GenreKey = "lofi" | "rock" | "synthwave" | "afrobeats" | "jazz" | "pop";

export const TRACK_ROLES = ["foundation", "harmonic", "rhythmic", "melodic", "textural"] as const;
export type TrackRole = typeof TRACK_ROLES[number];

export const CHORD_QUALITIES = [
  "maj", "min", "dim", "aug", "sus2", "sus4",
  "six", "min6", "maj7", "min7", "dom7",
  "maj9", "min9", "dom9", "min11",
] as const;
export type ChordQuality = typeof CHORD_QUALITIES[number];

export const ARTICULATIONS = ["sustained", "legato", "plucked", "stabbed", "staccato"] as const;
export type Articulation = typeof ARTICULATIONS[number];

export const FIGURE_SLOTS = ["main", "variation", "fill"] as const;
export type FigureSlot = typeof FIGURE_SLOTS[number];

/** One bar of harmony, expressed relative to the key — never as absolute pitches. */
export interface ChordSpec {
  degree: number;        // 0–6, scale degree of the chord root
  quality: ChordQuality;
  inversion?: number;    // 0–2
  bassDegree?: number;   // slash-chord bass, scale degree
}

/** A 4- or 8-bar harmonic macro-phrase. Sections reference these by id. */
export interface Phrase {
  id: string;
  bars: ChordSpec[];
  cadence: "open" | "closed" | "turnaround";
}

/** A melodic idea as contour, not as notes. The realizer times and pitches it. */
export interface Motif {
  id: string;
  degrees: number[];      // scale-degree contour; may exceed 7 for upper octaves
  rhythmFigureId: string;
  followChord: boolean;   // snap contour to nearest chord tone per bar
  character: string;
}

export interface Register { min: number; max: number }

export interface TrackPlan {
  id: string;
  name: string;
  color: string;
  role: TrackRole;
  register: Register;
  articulation: Articulation;
  voiceLimit: number;             // max simultaneous pitches (1 = monophonic)
  figures: Record<FigureSlot, string>; // rhythm figure ids
  motifId?: string;               // melodic tracks only
}

export interface DrumHit {
  drum: string;
  step: number;      // 1–16
  velocity: number;
  timingOffsetMs?: number;
}

export interface DrumPatternVariant {
  slot: FigureSlot;
  hits: DrumHit[];
}

export interface DrumTrack {
  id: string;
  patterns: DrumPatternVariant[];
}

export interface TrackArrangement {
  trackId: string;
  presence: number[];   // one 0–1 value per bar of the section
  intensity: number[];  // one 0–1 value per bar
  slot: FigureSlot;
  fillOnLastBar?: boolean;
}

export interface Section {
  id: string;
  name: string;
  bars: number;              // must be a multiple of its phrase length
  phraseId: string;
  energy: number;            // 0–1
  transposeSemitones: number;
  tracks: TrackArrangement[];
}

export interface SongComposition {
  genre: GenreKey;
  tempo: number;
  timeSignature: [number, number];
  key: string;               // e.g. "F# minor"
  grooveProfile: string;
  phrases: Phrase[];
  motifs: Motif[];
  sections: Section[];
  drum: DrumTrack;
  tracks: TrackPlan[];
}

// ── Realizer output ──────────────────────────────────────────────────────
export interface NoteEvent {
  midi: number;
  time: number;      // seconds
  duration: number;  // seconds
  velocity: number;
}

export interface RealizedTrack {
  id: string;
  name: string;
  isDrum: boolean;
  color?: string;
  notes: NoteEvent[];
}

export interface PerformanceIR {
  tempo: number;
  tracks: RealizedTrack[];
  barStartSeconds: number[]; // absolute start time of every bar, for UI slicing
}