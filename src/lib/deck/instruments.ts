import * as Tone from "tone";
import type { Row, RowRole } from "../../types/deck/Pack";

// Placeholder voices for step 1 (spec §12), replaced by samples in step 2.
//
// Every note is a few native Web Audio nodes that exist only while it sounds.
// Tone's PolySynth kept each voice alive as a full Synth with always-running
// signal nodes and rebuilt idle ones every second; with four Full rows that
// rendered slower than real time on a desktop, and phones fell over at three.

export interface RowVoice {
  /** Per-row gain. The engine gates it for immediate stops. */
  output: Tone.Gain;
  play(pitch: number, durSec: number, time: number, velocity: number): void;
  silence(time: number): void;
  dispose(): void;
}

interface Envelope {
  attack: number;
  decay: number;
  sustain: number;   // 0–1 of peak
  release: number;
}

// Tone wraps the browser context and its nodes (standardized-audio-context);
// nodes created from rawContext interconnect with Tone's inputs at runtime.
const rawContext = (node: Tone.ToneAudioNode) => node.context.rawContext as unknown as BaseAudioContext;
const inputOf = (node: Tone.Gain) => node.input as unknown as AudioNode;

/** Attack → decay to sustain → release after `hold`. Returns when the tail is inaudible. */
function shapeGain(param: AudioParam, time: number, peak: number, hold: number, env: Envelope): number {
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(peak, time + env.attack);
  param.setTargetAtTime(peak * env.sustain, time + env.attack, env.decay / 3);
  const off = time + Math.max(hold, env.attack);
  param.setTargetAtTime(0, off, env.release / 3);
  return off + env.release * 1.5;
}

// ── Pitched rows ─────────────────────────────────────────────────────────

interface PolyPreset {
  wave: OscillatorType;
  env: Envelope;
  gain: number;
  cutoff?: number;                                          // fixed row lowpass
  filterEnv?: { base: number; octaves: number; decay: number }; // per-note lowpass sweep
}

function presetFor(role: RowRole): PolyPreset {
  switch (role) {
    case "bass":
      return { wave: "sawtooth", env: { attack: 0.005, decay: 0.2, sustain: 0.7, release: 0.15 }, gain: 0.3, filterEnv: { base: 120, octaves: 2.5, decay: 0.2 } };
    case "pad":
      return { wave: "sawtooth", env: { attack: 0.35, decay: 0.3, sustain: 0.8, release: 1.0 }, gain: 0.08, cutoff: 1400 };
    case "lead":
    case "vocal":
      return { wave: "sawtooth", env: { attack: 0.008, decay: 0.15, sustain: 0.5, release: 0.25 }, gain: 0.14, cutoff: 2600 };
    case "arp":
      return { wave: "square", env: { attack: 0.008, decay: 0.15, sustain: 0.5, release: 0.25 }, gain: 0.1, cutoff: 2600 };
    default:
      return { wave: "triangle", env: { attack: 0.005, decay: 0.4, sustain: 0.35, release: 0.5 }, gain: 0.18 };
  }
}

function createPoly(role: RowRole, output: Tone.Gain): RowVoice {
  const ctx = rawContext(output);
  const p = presetFor(role);
  let rowIn = inputOf(output);
  let rowFilter: BiquadFilterNode | undefined;
  if (p.cutoff) {
    rowFilter = ctx.createBiquadFilter();
    rowFilter.type = "lowpass";
    rowFilter.frequency.value = p.cutoff;
    rowFilter.connect(rowIn);
    rowIn = rowFilter;
  }
  const active = new Set<{ osc: OscillatorNode; amp: GainNode }>();

  return {
    output,
    play: (pitch, dur, time, velocity) => {
      const osc = ctx.createOscillator();
      osc.type = p.wave;
      osc.frequency.value = Tone.mtof(pitch as Tone.Unit.MidiNote);
      const amp = ctx.createGain();
      const end = shapeGain(amp.gain, time, velocity * p.gain, dur, p.env);

      if (p.filterEnv) {
        const sweep = ctx.createBiquadFilter();
        sweep.type = "lowpass";
        sweep.Q.value = 2;
        sweep.frequency.setValueAtTime(p.filterEnv.base * 2 ** p.filterEnv.octaves, time);
        sweep.frequency.setTargetAtTime(p.filterEnv.base * 1.5, time, p.filterEnv.decay / 3);
        osc.connect(sweep).connect(amp);
      } else {
        osc.connect(amp);
      }
      amp.connect(rowIn);

      const note = { osc, amp };
      active.add(note);
      osc.onended = () => {
        amp.disconnect();
        active.delete(note);
      };
      osc.start(time);
      osc.stop(end);
    },
    silence: (time) => {
      for (const { osc, amp } of active) {
        amp.gain.cancelScheduledValues(time);
        amp.gain.setTargetAtTime(0, time, 0.01);
        try {
          osc.stop(time + 0.06);
        } catch {
          // already stopped
        }
      }
    },
    dispose: () => {
      rowFilter?.disconnect();
      output.dispose();
    },
  };
}

// ── Drum rows ────────────────────────────────────────────────────────────

type Hit = (time: number, velocity: number) => void;

function createKit(output: Tone.Gain): RowVoice {
  const ctx = rawContext(output);
  const rowIn = inputOf(output);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const decayGain = (time: number, peak: number, decay: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.setTargetAtTime(0, time, decay / 4);
    g.connect(rowIn);
    return g;
  };

  /** Pitched body with an optional downward sweep: kick, toms, congas, bells. */
  const tone = (opts: { wave: OscillatorType; from: number; to?: number; sweep?: number; decay: number; gain: number }): Hit => (time, v) => {
    const osc = ctx.createOscillator();
    osc.type = opts.wave;
    osc.frequency.setValueAtTime(opts.from, time);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, time + (opts.sweep ?? 0.05));
    const g = decayGain(time, v * opts.gain, opts.decay);
    osc.connect(g);
    osc.onended = () => g.disconnect();
    osc.start(time);
    osc.stop(time + opts.decay * 1.5);
  };

  /** Filtered noise burst: snares, claps, hats, cymbals, shakers. */
  const burst = (opts: { type: BiquadFilterType; freq: number; q?: number; decay: number; gain: number }): Hit => (time, v) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type;
    filter.frequency.value = opts.freq;
    if (opts.q) filter.Q.value = opts.q;
    const g = decayGain(time, v * opts.gain, opts.decay);
    src.connect(filter).connect(g);
    src.onended = () => g.disconnect();
    src.start(time, Math.random() * 0.5);
    src.stop(time + opts.decay * 1.5);
  };

  const both = (...hits: Hit[]): Hit => (time, v) => hits.forEach((h) => h(time, v));

  const kick = tone({ wave: "sine", from: 150, to: 42, sweep: 0.08, decay: 0.35, gain: 1 });
  const snare = both(burst({ type: "highpass", freq: 1800, decay: 0.15, gain: 0.6 }), tone({ wave: "triangle", from: 220, to: 180, decay: 0.08, gain: 0.3 }));
  const hat = burst({ type: "highpass", freq: 7000, decay: 0.04, gain: 0.35 });

  // GM percussion note → hit. Unmapped notes (maracas, cabasa…) use the shaker.
  const map = new Map<number, Hit>([
    [35, kick],
    [36, kick],
    [37, tone({ wave: "square", from: 1400, decay: 0.03, gain: 0.12 })],
    [38, snare],
    [40, snare],
    [39, burst({ type: "bandpass", freq: 1100, q: 1.5, decay: 0.12, gain: 0.9 })],
    [42, hat],
    [44, hat],
    [46, burst({ type: "highpass", freq: 6500, decay: 0.25, gain: 0.3 })],
    [49, burst({ type: "highpass", freq: 5000, decay: 1.0, gain: 0.25 })],
    [51, burst({ type: "highpass", freq: 6000, decay: 0.4, gain: 0.15 })],
    [45, tone({ wave: "sine", from: 160, to: 100, sweep: 0.1, decay: 0.25, gain: 0.7 })],
    [47, tone({ wave: "sine", from: 200, to: 130, sweep: 0.1, decay: 0.25, gain: 0.7 })],
    [50, tone({ wave: "sine", from: 260, to: 175, sweep: 0.1, decay: 0.25, gain: 0.7 })],
    [54, burst({ type: "highpass", freq: 8000, decay: 0.12, gain: 0.5 })],
    [56, tone({ wave: "square", from: 800, decay: 0.1, gain: 0.12 })],
    [62, tone({ wave: "sine", from: 330, to: 300, sweep: 0.03, decay: 0.14, gain: 0.5 })],
    [63, tone({ wave: "sine", from: 440, to: 400, sweep: 0.03, decay: 0.14, gain: 0.5 })],
    [64, tone({ wave: "sine", from: 262, to: 240, sweep: 0.03, decay: 0.14, gain: 0.5 })],
  ]);
  const shaker = burst({ type: "highpass", freq: 6000, decay: 0.05, gain: 0.25 });

  return {
    output,
    play: (note, _dur, time, velocity) => (map.get(note) ?? shaker)(time, velocity),
    silence: () => {},
    dispose: () => output.dispose(),
  };
}

export function createRowVoice(row: Row, destination: Tone.InputNode): RowVoice {
  const output = new Tone.Gain(1).connect(destination);
  return row.kind === "drums" ? createKit(output) : createPoly(row.role, output);
}
