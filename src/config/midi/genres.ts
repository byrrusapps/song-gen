import type { GenreKey, TrackRole } from "../../types/midi/Song";

export interface GenreGrammar {
  name: string;
  icon: string;
  tempoRange: [number, number];
  defaultGrooveProfile: string;
  typicalInstruments: string[];
  typicalRoles: TrackRole[];
  // Reference density targets per section type — 0 = nothing, 1 = everything at full tilt
  arrangementDensity: { intro: number; verse: number; preChorus: number; chorus: number; bridge: number; outro: number };
  description: string;
}

export const GENRE_REGISTRY: Record<GenreKey, GenreGrammar> = {
  lofi: {
    name: "Lo-Fi",
    icon: "coffee",
    tempoRange: [70, 90],
    defaultGrooveProfile: "laid_back_lofi",
    typicalInstruments: ["electric_piano", "rhodes_pad", "upright_bass", "vinyl_perc"],
    typicalRoles: ["harmonic", "foundation", "textural"],
    arrangementDensity: { intro: 0.25, verse: 0.5, preChorus: 0.6, chorus: 0.75, bridge: 0.4, outro: 0.2 },
    description: "Warm, dusty, laid-back. Swung 16ths, soft dynamics, jazzy 7th/9th chord voicings, understated drums that never dominate.",
  },
  rock: {
    name: "Rock",
    icon: "electric_bolt",
    tempoRange: [100, 140],
    defaultGrooveProfile: "tight_rock",
    typicalInstruments: ["distorted_guitar", "bass_guitar", "power_chords"],
    typicalRoles: ["rhythmic", "foundation", "melodic"],
    arrangementDensity: { intro: 0.35, verse: 0.55, preChorus: 0.7, chorus: 0.95, bridge: 0.5, outro: 0.3 },
    description: "Driving, tight, high-energy. Straight 8ths/16ths, strong backbeat, power-chord rhythm guitar, big dynamic jump into the chorus.",
  },
  synthwave: {
    name: "Synthwave",
    icon: "waves",
    tempoRange: [85, 118],
    defaultGrooveProfile: "driving_synthwave",
    typicalInstruments: ["analog_synth_bass", "arp_synth", "gated_drums", "pad"],
    typicalRoles: ["foundation", "melodic", "textural", "rhythmic"],
    arrangementDensity: { intro: 0.3, verse: 0.55, preChorus: 0.65, chorus: 0.85, bridge: 0.45, outro: 0.25 },
    description: "Retro-futuristic, gated-reverb drums, driving arpeggios, quantized precision, cinematic pad swells building toward choruses.",
  },
  afrobeats: {
    name: "Afrobeats",
    icon: "graphic_eq",
    tempoRange: [95, 115],
    defaultGrooveProfile: "interlocking_afrobeats",
    typicalInstruments: ["log_drum", "shaker", "conga", "interlocking_guitar", "keys"],
    typicalRoles: ["rhythmic", "foundation", "harmonic", "melodic"],
    arrangementDensity: { intro: 0.25, verse: 0.55, preChorus: 0.65, chorus: 0.9, bridge: 0.45, outro: 0.2 },
    description: "Syncopated, interlocking polyrhythms between guitar/keys/percussion, log-drum or 808 bass sliding under call-and-response hooks.",
  },
  jazz: {
    name: "Jazz",
    icon: "piano",
    tempoRange: [80, 130],
    defaultGrooveProfile: "loose_jazz",
    typicalInstruments: ["piano", "upright_bass", "ride_cymbal", "brushes"],
    typicalRoles: ["harmonic", "foundation", "melodic", "rhythmic"],
    arrangementDensity: { intro: 0.3, verse: 0.5, preChorus: 0.55, chorus: 0.7, bridge: 0.45, outro: 0.25 },
    description: "Loose swing feel, extended 9th/11th/13th chord voicings, walking bass, ride-cymbal-led rhythm, conversational comping.",
  },
  pop: {
    name: "Pop",
    icon: "star",
    tempoRange: [95, 128],
    defaultGrooveProfile: "clean_pop",
    typicalInstruments: ["synth_pluck", "clean_guitar", "bass_synth", "claps"],
    typicalRoles: ["melodic", "harmonic", "foundation", "rhythmic"],
    arrangementDensity: { intro: 0.3, verse: 0.5, preChorus: 0.65, chorus: 1.0, bridge: 0.4, outro: 0.25 },
    description: "Bright, hook-forward, clean production, punchy claps/snare, a clear energy jump on every chorus, minimal clutter in verses.",
  },
};

import { FIGURE_IDS, RHYTHM_FIGURES } from "./rhythmFigures"; // ← see note below

export function buildComposerPrompt(userPrompt: string, genre: GenreKey): string {
  const g = GENRE_REGISTRY[genre];
  const d = g.arrangementDensity;
  const figureList = Object.values(RHYTHM_FIGURES)
    .map((f) => `  ${f.id} — ${f.description}`)
    .join("\n");

  return `You are a composer and arranger. You are writing a musical PLAN, not MIDI data. You will never specify note timings, durations, or velocities — a separate engine derives all of those from your choices. Your job is harmony, arrangement, and character.

GENRE: ${g.name} (${g.tempoRange[0]}-${g.tempoRange[1]} BPM)
Feel: ${g.description}

USER BRIEF: "${userPrompt}"

HARMONY
- Write 2-4 phrases. Every phrase is EXACTLY 4 or 8 bars.
- Each bar gets one chord as a scale degree (0-6) plus a quality. No two adjacent bars may use the same degree+quality — a phrase that sits on one chord is a failure.
- The final bar of each phrase must move: use a turnaround, a borrowed chord, or an inversion that pulls back to bar 1. Set "cadence" accordingly.
- Prefer 7th/9th qualities where the genre supports colour.

TRACKS
- Give every track a role, a register (MIDI note bounds), a voiceLimit, and an articulation.
- Harmonic tracks: voiceLimit 3 maximum. Melodic tracks: voiceLimit 1, always.
- Bass registers must sit below 55 and must not overlap the harmonic tracks' registers — keep the low end clear.
- Choose "sustained" or "legato" articulation for pads, keys, and held guitars. Reserve "stabbed"/"staccato" for genuinely percussive parts. Most arrangements need at least one sustained track.
- Assign each track three rhythm figures by id — main, variation, and fill. The variation should be the main figure's rhythmic cousin, not a different idea. The fill is for section boundaries only.

AVAILABLE RHYTHM FIGURES (use these ids exactly):
${figureList}

MELODY
- Define motifs as a scale-degree contour only. Give melodic tracks a motifId.
- Choose figures that leave space: a lead using mel_sparse_call or mel_response leaves room for another instrument to answer it.

DRUMS
- The drum track has its own id (use "drums") and three hit patterns, one per slot: main, variation, fill.
- Each hit names a drum from the allowed list, a step from 1-16, and a velocity from 0.0-1.0. Steps 1, 5, 9 and 13 are the four downbeats.
- The main pattern is the section groove. The variation is the same groove with a small rhythmic change, not a different beat. The fill is sparse and only plays on section-boundary bars.
- Keep the groove uncluttered — a kick/snare backbone plus one hat or shaker layer beats a wall of hits.
- The drums must appear in every section's tracks array with their own presence and intensity curves, exactly like the pitched tracks. Intros typically start the drums at 0 and bring them in partway through.

ARRANGEMENT
- Each section names a phraseId, a bar count that is a multiple of that phrase's length, an energy value, and per-bar presence and intensity curves for every track INCLUDING the drum track (trackId "drums").
- Each section names a phraseId, a bar count that is a multiple of that phrase's length, an energy value, and per-bar presence and intensity curves for every track.
- Presence arrays must have exactly as many entries as the section has bars. Never set every track to a flat 1.0 — intros ramp up bar by bar from near zero.
- Density targets for this genre: intro ${d.intro}, verse ${d.verse}, pre-chorus ${d.preChorus}, chorus ${d.chorus}, bridge ${d.bridge}, outro ${d.outro}.
- The chorus is the peak: highest energy, fullest presence, most tracks active.`;
}