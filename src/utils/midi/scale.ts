const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const NOTE_PC: Record<string, number> = {
  c: 0, "c#": 1, db: 1, d: 2, "d#": 3, eb: 3, e: 4, f: 5,
  "f#": 6, gb: 6, g: 7, "g#": 8, ab: 8, a: 9, "a#": 10, bb: 10, b: 11,
};

export function parseKeyMode(key: string): "major" | "minor" {
  return /minor/i.test(key) ? "minor" : "major";
}

/** Extracts the tonic pitch class from a key string like "F# minor". */
export function parseKeyRoot(key: string): number {
  const match = key.trim().toLowerCase().match(/^([a-g][#b]?)/);
  return match ? (NOTE_PC[match[1]] ?? 0) : 0;
}

export function degreeToSemitone(mode: "major" | "minor", degreeIndex: number): number {
  const scale = mode === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  const octaveShift = Math.floor(degreeIndex / 7) * 12;
  const idx = ((degreeIndex % 7) + 7) % 7;
  return scale[idx] + octaveShift;
}