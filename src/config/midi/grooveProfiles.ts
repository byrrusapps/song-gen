// src/config/midi/grooveProfiles.ts — (replace the top import line with nothing, file has no external type import)
export interface GrooveProfile {
  id: string;
  swing: number;
  humanizeVelocity: number;
  roleOffsetsMs: Record<string, number>;
}
// ...rest identical to above

// Note: GrooveProfile isn't a distinct exported type in Song.ts — defined here
// since it's purely a MIDI-realization concern, not something the AI outputs directly
// beyond selecting an id.
export interface GrooveProfile {
  id: string;
  swing: number; // 0..1
  humanizeVelocity: number; // 0..1 jitter amount
  roleOffsetsMs: Record<string, number>; // matched against role/instrument name substrings
}

export const GROOVE_PROFILES: Record<string, GrooveProfile> = {
  laid_back_lofi: {
    id: "laid_back_lofi",
    swing: 0.18,
    humanizeVelocity: 0.08,
    roleOffsetsMs: { kick: -2, bass: -8, snare: 14, rim: 6, hat: 0, keys: 3, guitar: 4 },
  },
  tight_rock: {
    id: "tight_rock",
    swing: 0.04,
    humanizeVelocity: 0.05,
    roleOffsetsMs: { kick: -2, bass: -4, snare: 0, hat: 0, guitar: -1 },
  },
  driving_synthwave: {
    id: "driving_synthwave",
    swing: 0.0,
    humanizeVelocity: 0.02,
    roleOffsetsMs: { kick: 0, bass: 0, snare: 0, hat: 0, keys: 0 },
  },
  interlocking_afrobeats: {
    id: "interlocking_afrobeats",
    swing: 0.15,
    humanizeVelocity: 0.1,
    roleOffsetsMs: { kick: -3, bass: -5, snare: 8, shaker: 6, conga: 5, guitar: 4, keys: 2 },
  },
  loose_jazz: {
    id: "loose_jazz",
    swing: 0.32,
    humanizeVelocity: 0.14,
    roleOffsetsMs: { kick: -4, bass: -6, snare: 10, ride: 0, keys: 5 },
  },
  clean_pop: {
    id: "clean_pop",
    swing: 0.06,
    humanizeVelocity: 0.05,
    roleOffsetsMs: { kick: -1, bass: -2, snare: 2, hat: 0, keys: 1 },
  },
};

// 16th-note accent shape reused for hi-hats/shakers/ride, scaled by section intensity
export const ACCENT_CURVE_16 = [
  0.95, 0.4, 0.7, 0.3,
  0.9, 0.45, 0.75, 0.35,
  0.95, 0.4, 0.7, 0.3,
  0.85, 0.5, 0.8, 0.4,
];