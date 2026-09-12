import type { Articulation } from "../../types/midi/Song";

export type Spread = "block" | "strum_down" | "strum_up" | "arp_up" | "arp_down";

export interface RhythmFigure {
  id: string;
  /** Onset positions within a 16-step bar (1-indexed). */
  onsets: number[];
  /** Steps that receive a velocity accent. */
  accents?: number[];
  /** How the chord's voices are distributed across the onset. */
  spread: Spread;
  /** Overrides the articulation's default gate when a figure needs it. */
  gateOverride?: number;
  /** Allow a note to tie across the bar line when the next bar's chord matches. */
  tieAcrossBars?: boolean;
  description: string;
}

/** Gate = fraction of the distance to the next onset that the note actually
 *  sounds. This is where sustain comes from — the model never picks it. */
export const ARTICULATION_GATE: Record<Articulation, number> = {
  sustained: 0.98,
  legato: 1.02,   // slight overlap — real players don't fully release
  plucked: 0.72,
  stabbed: 0.4,
  staccato: 0.28,
};

export const RHYTHM_FIGURES: Record<string, RhythmFigure> = {
  // ── Sustained / pad ──
  whole_pad:        { id: "whole_pad", onsets: [1], spread: "block", tieAcrossBars: true, description: "One block chord held the entire bar." },
  half_pad:         { id: "half_pad", onsets: [1, 9], accents: [1], spread: "block", tieAcrossBars: true, description: "Two held half-note chords." },
  swell_pad:        { id: "swell_pad", onsets: [1], spread: "strum_down", tieAcrossBars: true, description: "Held chord with a slow rolled entrance." },

  // ── Rhythmic chordal ──
  strum_8ths:       { id: "strum_8ths", onsets: [1, 3, 5, 7, 9, 11, 13, 15], accents: [1, 9], spread: "strum_down", description: "Steady 8th-note strums." },
  strum_offbeat:    { id: "strum_offbeat", onsets: [3, 7, 11, 15], accents: [3, 11], spread: "strum_up", description: "Upstroke offbeat skank." },
  syncopated_stabs: { id: "syncopated_stabs", onsets: [1, 4, 7, 11, 14], accents: [1, 7], spread: "block", description: "Syncopated chord stabs with space between." },
  interlocking:     { id: "interlocking", onsets: [2, 5, 8, 12, 15], accents: [5, 12], spread: "strum_down", description: "Offbeat interlocking guitar figure." },
  push_chords:      { id: "push_chords", onsets: [1, 8, 11], accents: [1], spread: "block", tieAcrossBars: true, description: "Anticipated chords pushing into the next bar." },

  // ── Arpeggios ──
  arp_16_up:        { id: "arp_16_up", onsets: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], spread: "arp_up", description: "Continuous 16th arpeggio ascending." },
  arp_8_updown:     { id: "arp_8_updown", onsets: [1, 3, 5, 7, 9, 11, 13, 15], spread: "arp_up", description: "8th-note arpeggio." },
  arp_sparse:       { id: "arp_sparse", onsets: [1, 4, 7, 11], spread: "arp_up", description: "Sparse broken-chord figure." },

  // ── Bass ──
  bass_roots:       { id: "bass_roots", onsets: [1], spread: "block", tieAcrossBars: true, description: "Whole-note root, held." },
  bass_pulse_8ths:  { id: "bass_pulse_8ths", onsets: [1, 3, 5, 7, 9, 11, 13, 15], accents: [1, 9], spread: "block", description: "Driving 8th-note bass pulse." },
  bass_syncopated:  { id: "bass_syncopated", onsets: [1, 4, 7, 8, 11, 14], accents: [1, 8], spread: "block", description: "Syncopated bass with offbeat pushes." },
  bass_walk:        { id: "bass_walk", onsets: [1, 5, 9, 13], spread: "arp_up", description: "Walking quarter-note bass." },

  // ── Melodic ──
  mel_sparse_call:  { id: "mel_sparse_call", onsets: [3, 6, 11], accents: [3], spread: "block", description: "Sparse phrase that rests on beats 1 and 3 — leaves room to answer." },
  mel_syncopated:   { id: "mel_syncopated", onsets: [2, 4, 7, 10, 12, 15], accents: [4, 10], spread: "block", description: "Off-beat syncopated top line with varied lengths." },
  mel_long_tones:   { id: "mel_long_tones", onsets: [1, 9], spread: "block", tieAcrossBars: true, description: "Long sustained melodic tones." },
  mel_response:     { id: "mel_response", onsets: [9, 12, 15], accents: [9], spread: "block", description: "Second-half-of-bar answering phrase." },

  // ── Transitions ──
  fill_pickup:      { id: "fill_pickup", onsets: [11, 13, 15], accents: [15], spread: "arp_up", description: "Sparse pickup into the next section." },
  fill_rise:        { id: "fill_rise", onsets: [9, 11, 13, 14, 15, 16], spread: "arp_up", description: "Ascending rise across the final bar." },
};

export const FIGURE_IDS = Object.keys(RHYTHM_FIGURES);