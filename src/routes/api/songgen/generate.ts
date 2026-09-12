import type { APIEvent } from "@solidjs/start/server";
import { GoogleGenAI, Type } from "@google/genai";
import { GM_PERCUSSION } from "../../../utils/midi/gmPercussion";
import {
  type SongComposition, type GenreKey,
  CHORD_QUALITIES, TRACK_ROLES, ARTICULATIONS, FIGURE_SLOTS,
} from "../../../types/midi/Song";
import { buildComposerPrompt, GENRE_REGISTRY } from "../../../config/midi/genres";
import { FIGURE_IDS } from "../../../config/midi/rhythmFigures";
import { GROOVE_PROFILES } from "../../../config/midi/grooveProfiles";
import { validateAndRepair } from "../../../utils/midi/validator";

const DRUM_KEYS = Object.keys(GM_PERCUSSION);

// Constraints deliberately live in the prompt and validateAndRepair(), not here.
// Gemini's response-schema validator rejects numeric bounds and array-length
// constraints inconsistently, and the validator enforces them reliably anyway.

const chordSpecSchema = {
  type: Type.OBJECT,
  properties: {
    degree: { type: Type.NUMBER, description: "Scale degree of the chord root, 0-6." },
    quality: { type: Type.STRING, enum: [...CHORD_QUALITIES] },
    inversion: { type: Type.NUMBER, description: "0, 1 or 2." },
    bassDegree: { type: Type.NUMBER, description: "Optional slash-chord bass, scale degree 0-6." },
  },
  required: ["degree", "quality"],
};

const phraseSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    bars: {
      type: Type.ARRAY,
      items: chordSpecSchema,
      description: "Exactly 4 or 8 chords, one per bar. Adjacent bars must not share the same degree and quality.",
    },
    cadence: { type: Type.STRING, enum: ["open", "closed", "turnaround"] },
  },
  required: ["id", "bars", "cadence"],
};

const motifSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    degrees: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "Scale-degree contour; values above 6 read as upper octaves.",
    },
    rhythmFigureId: { type: Type.STRING, enum: [...FIGURE_IDS] },
    followChord: { type: Type.BOOLEAN },
    character: { type: Type.STRING },
  },
  required: ["id", "degrees", "rhythmFigureId", "followChord", "character"],
};

const trackPlanSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    color: { type: Type.STRING },
    role: { type: Type.STRING, enum: [...TRACK_ROLES] },
    register: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER, description: "Lowest MIDI note, 21-108." },
        max: { type: Type.NUMBER, description: "Highest MIDI note, 21-108." },
      },
      required: ["min", "max"],
    },
    articulation: { type: Type.STRING, enum: [...ARTICULATIONS] },
    voiceLimit: { type: Type.NUMBER, description: "Max simultaneous pitches. 1 for melodic tracks, up to 3 for harmonic." },
    figures: {
      type: Type.OBJECT,
      properties: {
        main: { type: Type.STRING, enum: [...FIGURE_IDS] },
        variation: { type: Type.STRING, enum: [...FIGURE_IDS] },
        fill: { type: Type.STRING, enum: [...FIGURE_IDS] },
      },
      required: ["main", "variation", "fill"],
    },
    motifId: { type: Type.STRING },
  },
  required: ["id", "name", "color", "role", "register", "articulation", "voiceLimit", "figures"],
};

const drumHitSchema = {
  type: Type.OBJECT,
  properties: {
    drum: { type: Type.STRING, enum: DRUM_KEYS },
    step: { type: Type.NUMBER, description: "Step within the bar, 1-16." },
    velocity: { type: Type.NUMBER, description: "0.0-1.0." },
    timingOffsetMs: { type: Type.NUMBER, description: "Micro-timing, -30 to 30." },
  },
  required: ["drum", "step", "velocity"],
};

const drumTrackSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    patterns: {
      type: Type.ARRAY,
      description: "One entry per slot: main, variation, fill.",
      items: {
        type: Type.OBJECT,
        properties: {
          slot: { type: Type.STRING, enum: [...FIGURE_SLOTS] },
          hits: { type: Type.ARRAY, items: drumHitSchema },
        },
        required: ["slot", "hits"],
      },
    },
  },
  required: ["id", "patterns"],
};

const trackArrangementSchema = {
  type: Type.OBJECT,
  properties: {
    trackId: { type: Type.STRING },
    presence: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "One 0.0-1.0 value per bar of this section, in order.",
    },
    intensity: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "One 0.0-1.0 value per bar of this section, in order.",
    },
    slot: { type: Type.STRING, enum: [...FIGURE_SLOTS] },
    fillOnLastBar: { type: Type.BOOLEAN },
  },
  required: ["trackId", "presence", "intensity", "slot"],
};

const sectionSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    bars: { type: Type.NUMBER, description: "Must be a multiple of the referenced phrase's length." },
    phraseId: { type: Type.STRING },
    energy: { type: Type.NUMBER, description: "0.0-1.0." },
    transposeSemitones: { type: Type.NUMBER, description: "-12 to 12." },
    tracks: { type: Type.ARRAY, items: trackArrangementSchema },
  },
  required: ["id", "name", "bars", "phraseId", "energy", "transposeSemitones", "tracks"],
};

const compositionSchema = {
  type: Type.OBJECT,
  properties: {
    genre: { type: Type.STRING, enum: Object.keys(GENRE_REGISTRY) },
    tempo: { type: Type.NUMBER, description: "60-180 BPM." },
    timeSignature: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    key: { type: Type.STRING, description: 'e.g. "F# minor"' },
    grooveProfile: { type: Type.STRING, enum: Object.keys(GROOVE_PROFILES) },
    phrases: { type: Type.ARRAY, items: phraseSchema, description: "2-4 phrases." },
    motifs: { type: Type.ARRAY, items: motifSchema, description: "Up to 4 motifs." },
    sections: { type: Type.ARRAY, items: sectionSchema },
    drum: drumTrackSchema,
    tracks: { type: Type.ARRAY, items: trackPlanSchema, description: "Up to 6 pitched tracks." },
  },
  required: ["genre", "tempo", "timeSignature", "key", "grooveProfile", "phrases", "motifs", "sections", "drum", "tracks"],
};

function detectGenre(prompt: string, requested?: string): GenreKey {
  if (requested && requested in GENRE_REGISTRY) return requested as GenreKey;
  const lower = prompt.toLowerCase();
  for (const key of Object.keys(GENRE_REGISTRY) as GenreKey[]) if (lower.includes(key)) return key;
  return "lofi";
}

export async function POST(event: APIEvent) {
  const { prompt, genre: reqGenre } = await event.request.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), { status: 500 });

  const selectedGenre = detectGenre(prompt, reqGenre);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: buildComposerPrompt(prompt, selectedGenre),
      config: { responseMimeType: "application/json", responseSchema: compositionSchema },
    });

    const text = response.text;
    if (!text) return new Response(JSON.stringify({ error: "Empty response from composer pass" }), { status: 502 });

    let composition: SongComposition = JSON.parse(text);
    const { song, issues } = validateAndRepair(composition);
    composition = song;

    return new Response(JSON.stringify({ ...composition, _issues: issues }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Composer error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Composer request failed" }), { status: 502 });
  }
}