import type {
  SongComposition, PerformanceIR, RealizedTrack, NoteEvent,
  ChordSpec, TrackPlan, FigureSlot, Phrase,
} from "../../types/midi/Song";
import { RHYTHM_FIGURES, ARTICULATION_GATE } from "../../config/midi/rhythmFigures";
import { GROOVE_PROFILES, ACCENT_CURVE_16 } from "../../config/midi/grooveProfiles";
import { GENRE_REGISTRY } from "../../config/midi/genres";
import { gmNoteFor } from "./gmPercussion";
import { voiceChord } from "./voicing";
import { parseKeyMode, parseKeyRoot, degreeToSemitone } from "./scale";
import { normalizeCurve, thinByPresence, intensityToVelocityScale } from "./arrangement";

const STEPS_PER_BAR = 16;
const TIE_EPSILON = 0.02; // seconds
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function resolveGroove(song: SongComposition) {
  return (
    GROOVE_PROFILES[song.grooveProfile] ||
    GROOVE_PROFILES[GENRE_REGISTRY[song.genre]?.defaultGrooveProfile] ||
    GROOVE_PROFILES.clean_pop
  );
}

function roleOffsetMs(name: string, offsets: Record<string, number>): number {
  const lower = name.toLowerCase();
  const key = Object.keys(offsets).find((k) => lower.includes(k));
  return key ? offsets[key] : 0;
}

function swingOffsetMs(step: number, swing: number, secPerBeat: number): number {
  if (swing <= 0 || (step - 1) % 2 === 0) return 0;
  return swing * ((secPerBeat * 1000) / 4) * 0.5;
}

/**
 * The core anti-staccato rule: a note lasts until the next onset, scaled by
 * the track's articulation gate. Nothing in the composition payload can make
 * this short — a figure with one onset per bar produces a full-bar note.
 */
function durationStepsFor(onsets: number[], index: number): number {
  const current = onsets[index];
  const next = onsets[index + 1] ?? STEPS_PER_BAR + 1;
  return next - current;
}

/** Merges same-pitch notes that butt up against each other into one held
 *  note, so a sustained pad across four identical bars is a single event
 *  rather than four retriggers. */
function tieNotes(notes: NoteEvent[]): NoteEvent[] {
  const byPitch = new Map<number, NoteEvent[]>();
  for (const n of notes) {
    if (!byPitch.has(n.midi)) byPitch.set(n.midi, []);
    byPitch.get(n.midi)!.push(n);
  }
  const out: NoteEvent[] = [];
  for (const group of byPitch.values()) {
    group.sort((a, b) => a.time - b.time);
    let current = { ...group[0] };
    for (let i = 1; i < group.length; i++) {
      const next = group[i];
      const currentEnd = current.time + current.duration;
      if (Math.abs(next.time - currentEnd) <= TIE_EPSILON) {
        current.duration = next.time + next.duration - current.time;
      } else {
        out.push(current);
        current = { ...next };
      }
    }
    out.push(current);
  }
  return out.sort((a, b) => a.time - b.time);
}

function phraseFor(song: SongComposition, phraseId: string): Phrase | undefined {
  return song.phrases.find((p) => p.id === phraseId) ?? song.phrases[0];
}

function figureIdFor(track: TrackPlan, slot: FigureSlot): string {
  return track.figures?.[slot] || track.figures?.main || "whole_pad";
}

export function realizeComposition(song: SongComposition): PerformanceIR {
  const secPerBeat = 60 / Math.max(1, song.tempo || 120);
  const beatsPerBar = song.timeSignature?.[0] ?? 4;
  const secPerBar = beatsPerBar * secPerBeat;
  const secPerStep = secPerBar / STEPS_PER_BAR;
  const mode = parseKeyMode(song.key);
  const keyRootPc = parseKeyRoot(song.key);
  const groove = resolveGroove(song);

  const totalBars = song.sections.reduce((sum, s) => sum + s.bars, 0);
  const barStartSeconds = Array.from({ length: totalBars + 1 }, (_, i) => i * secPerBar);

  const realized: RealizedTrack[] = [];

  // ── Drums ────────────────────────────────────────────────────────────
  const drumNotes: NoteEvent[] = [];
  let barCursor = 0;
  for (const section of song.sections) {
    const arr = section.tracks.find((t) => t.trackId === song.drum.id);
    const presence = normalizeCurve(arr?.presence, section.bars, arr ? 0.8 : 0);
    const intensity = normalizeCurve(arr?.intensity, section.bars, 0.7);

    for (let bar = 0; bar < section.bars; bar++) {
      if (!arr || presence[bar] <= 0.001) continue;
      const isLast = bar === section.bars - 1;
      const slot: FigureSlot = isLast && arr.fillOnLastBar ? "fill" : arr.slot;
      const pattern =
        song.drum.patterns.find((p) => p.slot === slot) ||
        song.drum.patterns.find((p) => p.slot === "main");
      if (!pattern) continue;

      const velScale = intensityToVelocityScale(intensity[bar]);
      const barStart = (barCursor + bar) * secPerBar;

      for (const hit of thinByPresence(pattern.hits, presence[bar])) {
        const step = ((Math.max(1, Math.round(hit.step)) - 1) % STEPS_PER_BAR) + 1;
        let velocity = (hit.velocity ?? 0.8) * velScale;
        if (hit.drum.includes("hat")) velocity *= ACCENT_CURVE_16[(step - 1) % 16];
        velocity += (Math.random() - 0.5) * 2 * groove.humanizeVelocity;

        const offsetMs =
          (hit.timingOffsetMs ?? 0) +
          roleOffsetMs(hit.drum, groove.roleOffsetsMs) +
          swingOffsetMs(step, groove.swing, secPerBeat);

        const time = barStart + (step - 1) * secPerStep + offsetMs / 1000;
        if (!Number.isFinite(time) || time < 0) continue;

        drumNotes.push({
          midi: clamp(gmNoteFor(hit.drum), 0, 127),
          time,
          duration: 0.12,
          velocity: clamp(velocity, 0.05, 1),
        });
      }
    }
    barCursor += section.bars;
  }
  realized.push({ id: song.drum.id, name: "Drums", isDrum: true, notes: drumNotes });

  // ── Pitched tracks ───────────────────────────────────────────────────
  for (const track of song.tracks) {
    const notes: NoteEvent[] = [];
    const gate = ARTICULATION_GATE[track.articulation] ?? 0.9;
    const motif = track.motifId ? song.motifs.find((m) => m.id === track.motifId) : undefined;
    let previousVoicing: number[] | undefined;
    let motifCursor = 0;
    barCursor = 0;

    for (const section of song.sections) {
      const arr = section.tracks.find((t) => t.trackId === track.id);
      const phrase = phraseFor(song, section.phraseId);
      if (!arr || !phrase?.bars?.length) { barCursor += section.bars; continue; }

      const presence = normalizeCurve(arr.presence, section.bars, 0.8);
      const intensity = normalizeCurve(arr.intensity, section.bars, 0.7);

      for (let bar = 0; bar < section.bars; bar++) {
        const barPresence = presence[bar];
        if (barPresence <= 0.001) { previousVoicing = undefined; continue; }

        const isLast = bar === section.bars - 1;
        const slot: FigureSlot = isLast && arr.fillOnLastBar ? "fill" : arr.slot;
        const figure = RHYTHM_FIGURES[figureIdFor(track, slot)] ?? RHYTHM_FIGURES.whole_pad;

        const chord: ChordSpec = phrase.bars[bar % phrase.bars.length];
        const voicing = voiceChord(chord, {
          keyRootPc,
          mode,
          transpose: section.transposeSemitones ?? 0,
          register: track.register,
          voiceLimit: Math.max(1, track.voiceLimit),
          previous: previousVoicing,
        });
        previousVoicing = voicing;

        const velScale = intensityToVelocityScale(intensity[bar]);
        const barStart = (barCursor + bar) * secPerBar;
        const activeOnsets = thinByPresence(
          figure.onsets.map((step) => ({ step, velocity: figure.accents?.includes(step) ? 1 : 0.6 })),
          barPresence
        ).map((o) => o.step).sort((a, b) => a - b);

        activeOnsets.forEach((step, onsetIndex) => {
          const fullIndex = figure.onsets.indexOf(step);
          const durSteps = durationStepsFor(figure.onsets, fullIndex);
          const effectiveGate = figure.gateOverride ?? gate;
          const duration = Math.max(0.05, durSteps * secPerStep * effectiveGate);

          const offsetMs =
            roleOffsetMs(track.name, groove.roleOffsetsMs) +
            swingOffsetMs(step, groove.swing, secPerBeat);
          const baseTime = barStart + (step - 1) * secPerStep + offsetMs / 1000;

          let velocity = (figure.accents?.includes(step) ? 0.92 : 0.72) * velScale;
          velocity += (Math.random() - 0.5) * 2 * groove.humanizeVelocity;
          velocity = clamp(velocity, 0.05, 1);

          // Melodic tracks are monophonic by construction: one contour note.
          if (track.voiceLimit === 1) {
            const degrees = motif?.degrees?.length ? motif.degrees : [0, 2, 4, 2];
            const degree = degrees[motifCursor % degrees.length];
            motifCursor++;

            let pitch =
              60 + keyRootPc + (section.transposeSemitones ?? 0) + degreeToSemitone(mode, degree);
            if (motif?.followChord) {
              // Nudge to the nearest tone of the current chord's voicing.
              const target = voicing.reduce(
                (best, v) => (Math.abs((v % 12) - (pitch % 12)) < Math.abs((best % 12) - (pitch % 12)) ? v : best),
                voicing[0]
              );
              pitch += ((target % 12) - (pitch % 12));
            }
            // Fold into the track's register rather than clamping to its edge.
            while (pitch < track.register.min) pitch += 12;
            while (pitch > track.register.max) pitch -= 12;

            if (Number.isFinite(pitch) && baseTime >= 0) {
              notes.push({ midi: clamp(pitch, 0, 127), time: baseTime, duration, velocity });
            }
            return;
          }

          // Chordal tracks: distribute the voicing according to the figure's spread.
          if (figure.spread === "arp_up" || figure.spread === "arp_down") {
            const ordered = figure.spread === "arp_up" ? voicing : [...voicing].reverse();
            const pitch = ordered[onsetIndex % ordered.length];
            if (Number.isFinite(pitch) && baseTime >= 0) {
              notes.push({ midi: clamp(pitch, 0, 127), time: baseTime, duration, velocity });
            }
            return;
          }

          const strumMs = figure.spread === "block" ? 0 : 12;
          const ordered = figure.spread === "strum_up" ? [...voicing].reverse() : voicing;
          ordered.forEach((pitch, i) => {
            const time = baseTime + (i * strumMs) / 1000;
            if (!Number.isFinite(pitch) || time < 0) return;
            notes.push({ midi: clamp(pitch, 0, 127), time, duration, velocity });
          });
        });
      }
      barCursor += section.bars;
    }

    realized.push({
      id: track.id,
      name: track.name,
      isDrum: false,
      color: track.color,
      notes: tieNotes(notes),
    });
  }

  return { tempo: song.tempo, tracks: realized, barStartSeconds };
}