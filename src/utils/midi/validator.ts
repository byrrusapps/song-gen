import type { SongComposition, FigureSlot, DrumHit, TrackArrangement } from "../../types/midi/Song";
import { RHYTHM_FIGURES } from "../../config/midi/rhythmFigures";
import { normalizeCurve } from "./arrangement";


/** Last-resort groove so a composition is never silent on drums. Deliberately
 *  plain — if this fires, the composer pass failed and the issue log says so. */
const FALLBACK_GROOVE: DrumHit[] = [
  { drum: "kick", step: 1, velocity: 0.95 },
  { drum: "closed_hat", step: 3, velocity: 0.5 },
  { drum: "snare", step: 5, velocity: 0.85 },
  { drum: "closed_hat", step: 7, velocity: 0.45 },
  { drum: "kick", step: 9, velocity: 0.9 },
  { drum: "closed_hat", step: 11, velocity: 0.5 },
  { drum: "snare", step: 13, velocity: 0.85 },
  { drum: "closed_hat", step: 15, velocity: 0.45 },
];

const DRUM_ALIASES = ["drum", "kit", "percussion", "perc", "beat"];

export interface ValidationIssue { severity: "warning" | "repaired"; message: string }

/** Deterministic repair of the mistakes the composer pass actually makes.
 *  Everything here is a structural fix — nothing invents musical content. */
export function validateAndRepair(song: SongComposition): { song: SongComposition; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // 1. Phrases must be 4 or 8 bars with no adjacent duplicate chords.
  for (const phrase of song.phrases ?? []) {
    if (phrase.bars.length !== 4 && phrase.bars.length !== 8) {
      const target = phrase.bars.length < 6 ? 4 : 8;
      while (phrase.bars.length < target) phrase.bars.push({ ...phrase.bars[phrase.bars.length % phrase.bars.length] });
      phrase.bars.length = target;
      issues.push({ severity: "repaired", message: `Phrase ${phrase.id} resized to ${target} bars` });
    }
    for (let i = 1; i < phrase.bars.length; i++) {
      const prev = phrase.bars[i - 1];
      const cur = phrase.bars[i];
      if (prev.degree === cur.degree && prev.quality === cur.quality) {
        // Rotate to the relative sub/dominant rather than repeating the chord.
        cur.degree = (cur.degree + (i % 2 === 0 ? 3 : 5)) % 7;
        issues.push({ severity: "repaired", message: `Phrase ${phrase.id} bar ${i + 1}: broke a repeated chord` });
      }
    }
  }

    // 1b. Drum track must exist, have a main pattern, and be arranged in every section.
  const drum = (song.drum ??= { id: "drums", patterns: [] });
  if (!drum.id) {
    drum.id = "drums";
    issues.push({ severity: "repaired", message: "Drum track had no id — set to 'drums'" });
  }

  // The composer sometimes lists the kit among the pitched tracks; it doesn't belong there.
  const strayDrumTrack = song.tracks?.findIndex((t) => t.id === drum.id);
  if (strayDrumTrack !== undefined && strayDrumTrack >= 0) {
    song.tracks.splice(strayDrumTrack, 1);
    issues.push({ severity: "repaired", message: "Removed the drum kit from the pitched track list" });
  }

  drum.patterns = (drum.patterns ?? []).filter((p) => p?.hits?.length);
  if (!drum.patterns.length) {
    drum.patterns = [{ slot: "main", hits: FALLBACK_GROOVE }];
    issues.push({ severity: "warning", message: "Composer returned no drum patterns — substituted a basic groove" });
  }
  if (!drum.patterns.some((p) => p.slot === "main")) {
    drum.patterns[0].slot = "main";
    issues.push({ severity: "repaired", message: "Drum track had no main pattern — promoted the first one" });
  }

  const pitchedIds = new Set((song.tracks ?? []).map((t) => t.id));
  for (const section of song.sections ?? []) {
    section.tracks ??= [];
    let arr = section.tracks.find((t) => t.trackId === drum.id);

    // Catch a near-miss id ("drum", "kit", "percussion") that matches no pitched track.
    if (!arr) {
      const fuzzy = section.tracks.find(
        (t) => !pitchedIds.has(t.trackId) && DRUM_ALIASES.some((a) => t.trackId.toLowerCase().includes(a))
      );
      if (fuzzy) {
        issues.push({ severity: "repaired", message: `${section.name}: drum arrangement id "${fuzzy.trackId}" → "${drum.id}"` });
        fuzzy.trackId = drum.id;
        arr = fuzzy;
      }
    }

    // Still nothing: derive a curve from the section's energy so drums aren't silent.
    if (!arr) {
      const level = Math.max(0.35, Math.min(1, section.energy ?? 0.6));
      const isOpener = /intro/i.test(section.name);
      const injected: TrackArrangement = {
        trackId: drum.id,
        presence: Array.from({ length: section.bars }, (_, i) =>
          isOpener ? Math.min(level, (i / Math.max(1, section.bars - 1)) * level) : level
        ),
        intensity: Array.from({ length: section.bars }, () => level),
        slot: "main",
        fillOnLastBar: true,
      };
      section.tracks.push(injected);
      issues.push({ severity: "warning", message: `${section.name}: no drum arrangement — derived one from section energy` });
    }
  }

  // 2. Sections must be a whole number of phrase repetitions.
  for (const section of song.sections ?? []) {
    const phrase = song.phrases.find((p) => p.id === section.phraseId) ?? song.phrases[0];
    if (!phrase) continue;
    section.phraseId = phrase.id;
    const len = phrase.bars.length;
    if (section.bars % len !== 0) {
      const fixed = Math.max(len, Math.round(section.bars / len) * len);
      issues.push({ severity: "repaired", message: `${section.name}: ${section.bars} bars → ${fixed} to fit its phrase` });
      section.bars = fixed;
    }
    for (const arr of section.tracks ?? []) {
      arr.presence = normalizeCurve(arr.presence, section.bars, 0.8);
      arr.intensity = normalizeCurve(arr.intensity, section.bars, 0.7);
    }
  }

  // 3. Track constraints: real voice limits, valid figure ids.
  for (const track of song.tracks ?? []) {
    if (track.role === "melodic" && track.voiceLimit !== 1) {
      track.voiceLimit = 1;
      issues.push({ severity: "repaired", message: `${track.name}: forced monophonic (melodic role)` });
    }
    if (track.role === "harmonic" && track.voiceLimit > 3) {
      track.voiceLimit = 3;
      issues.push({ severity: "repaired", message: `${track.name}: voice limit capped at 3` });
    }
    for (const slot of ["main", "variation", "fill"] as FigureSlot[]) {
      if (!RHYTHM_FIGURES[track.figures?.[slot]]) {
        track.figures = { ...track.figures, [slot]: track.figures?.main ?? "whole_pad" };
        issues.push({ severity: "repaired", message: `${track.name}: unknown ${slot} figure replaced` });
      }
    }
  }

    for (const pattern of drum.patterns) {
    if (!["main", "variation", "fill"].includes(pattern.slot)) {
      issues.push({ severity: "repaired", message: `Drum pattern slot "${pattern.slot}" → "main"` });
      pattern.slot = "main";
    }
  }

  // 4. Warn if nothing sustains — the symptom we're actually chasing.
  const hasSustain = song.tracks?.some(
    (t) => t.articulation === "sustained" || t.articulation === "legato"
  );
  if (!hasSustain) {
    issues.push({ severity: "warning", message: "No track uses a sustained or legato articulation — arrangement may sound clipped" });
  }

  return { song, issues };
}