export interface GmPercussionEntry {
  note: number;
  label: string;
  color: string;
}

export const GM_PERCUSSION: Record<string, GmPercussionEntry> = {
  kick:       { note: 36, label: "Kick Drum",     color: "#f87171" },
  rim:        { note: 37, label: "Rimshot",       color: "#fb923c" },
  snare:      { note: 38, label: "Snare Drum",    color: "#fbbf24" },
  clap:       { note: 39, label: "Hand Clap",     color: "#facc15" },
  closed_hat: { note: 42, label: "Closed Hi-Hat", color: "#38bdf8" },
  low_tom:    { note: 45, label: "Low Tom",       color: "#a3e635" },
  open_hat:   { note: 46, label: "Open Hi-Hat",   color: "#22d3ee" },
  mid_tom:    { note: 47, label: "Mid Tom",       color: "#4ade80" },
  high_tom:   { note: 50, label: "High Tom",      color: "#34d399" },
  crash:      { note: 49, label: "Crash Cymbal",  color: "#c084fc" },
  ride:       { note: 51, label: "Ride Cymbal",   color: "#a78bfa" },
  tambourine: { note: 54, label: "Tambourine",    color: "#f472b6" },
  cowbell:    { note: 56, label: "Cowbell",       color: "#fb7185" },
};

export function gmNoteFor(key: string): number {
  return GM_PERCUSSION[key]?.note ?? 36;
}

const BY_NOTE = new Map<number, GmPercussionEntry & { key: string }>(
  Object.entries(GM_PERCUSSION).map(([key, entry]) => [entry.note, { ...entry, key }])
);

/** Reverse lookup so the note roll can label realized drum notes, which
 *  carry MIDI numbers rather than the original drum keys. */
export function gmEntryForNote(note: number) {
  return BY_NOTE.get(note);
}