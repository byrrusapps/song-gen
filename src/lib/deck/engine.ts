import * as Tone from "tone";
import { batch } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import { STEPS_PER_BAR, type Cell, type DrumHit, type Pack, type PatternNote } from "../../types/deck/Pack";
import { cycleSteps, inFlightAt, localStep, mod, nextBoundary, oneShotStart, quantumSteps } from "../../utils/deck/timing";
import { keyContext, resolvePitch, spineChordAt, type KeyContext } from "../../utils/deck/pitch";
import { createRowVoice, type RowVoice } from "./instruments";

// Step scheduler for the launch grid (spec §2).
//
// The Tone transport runs linearly and fires once per 16th; the pack cycle is
// derived as `step mod cycle`. Tone's own loop points are deliberately unused:
// free-phase cells of 1 or 2 bars would lose their phase every time the
// transport jumped back to zero.

type LaunchMode = "loop" | "oneShot";

interface Playback {
  cellIndex: number;
  anchor: number;              // absolute step where the cell's step 0 falls
  mode: LaunchMode;
  resume: Playback | null;     // one-shots only: what the row returns to
}

type Pending =
  | { kind: "launch"; cellIndex: number; at: number }
  | { kind: "oneShot"; cellIndex: number; at: number }
  | { kind: "stop"; at: number };

interface RowRuntime {
  playback: Playback | null;
  pending: Pending | null;
  gated: boolean;              // output muted by an immediate stop until relaunch
}

export interface RowUi {
  playing: number | null;
  queued: number | null;
  stopQueued: boolean;
  oneShot: boolean;
  progress: number;            // 0–1 through the playing cell
}

/** Read-outs for debugging audio on devices with no console attached. */
export interface DeckDiag {
  state: string;
  sampleRate: number;
  latencyMs: number;           // base + output latency reported by the browser
  headroomMs: number;          // least lead the scheduler had over the audio clock last bar
  lateSteps: number;           // steps scheduled after their time had already passed
  errors: number;
  lastError: string;
}

export interface DeckUi {
  playing: boolean;
  cycleStep: number;
  rows: RowUi[];
  diag: DeckDiag;
}

const cellLength = (cell: Cell) => cell.bars * STEPS_PER_BAR;

/** Notes bucketed by local step so each tick is a lookup, not a scan. */
function indexByStep(cell: Cell): (PatternNote | DrumHit)[][] {
  const buckets: (PatternNote | DrumHit)[][] = Array.from({ length: cellLength(cell) }, () => []);
  const events = "notes" in cell ? cell.notes : cell.hits;
  for (const e of events) buckets[mod(e.step, buckets.length)].push(e);
  return buckets;
}

export class DeckEngine {
  readonly pack: Pack;
  readonly cycle: number;
  readonly quantum: number;
  readonly ui: DeckUi;

  private setUi: SetStoreFunction<DeckUi>;
  private context: Tone.Context;
  private key: KeyContext;
  private stepIndex: (PatternNote | DrumHit)[][][][];
  private runtimes: RowRuntime[];
  private voices: RowVoice[] = [];
  private master?: Tone.Limiter;
  private repeatId?: number;
  private lastScheduled = -1;
  private worstLead = Infinity;
  private lateSteps = 0;
  private errors = 0;
  private lastError = "";

  constructor(pack: Pack) {
    this.pack = pack;
    this.cycle = cycleSteps(pack.rows.flatMap((r) => r.cells.map((c) => c.bars)));
    this.quantum = quantumSteps(this.cycle);
    this.key = keyContext(pack);
    this.stepIndex = pack.rows.map((row) => row.cells.map(indexByStep));
    this.runtimes = pack.rows.map(() => ({ playback: null, pending: null, gated: false }));

    // Launches are quantized, so a larger output buffer costs nothing audible
    // and buys headroom against underruns on phones (spec §11).
    this.context = new Tone.Context({ latencyHint: "playback", lookAhead: 0.2 });
    Tone.setContext(this.context);

    const [ui, setUi] = createStore<DeckUi>({
      playing: false,
      cycleStep: 0,
      rows: pack.rows.map(() => ({ playing: null, queued: null, stopQueued: false, oneShot: false, progress: 0 })),
      diag: { state: this.context.state, sampleRate: this.context.sampleRate, latencyMs: 0, headroomMs: 0, lateSteps: 0, errors: 0, lastError: "" },
    });
    this.ui = ui;
    this.setUi = setUi;

    // Ticks stop while the context is suspended, so state can't ride on them.
    this.context.on("statechange", () => this.setUi("diag", "state", this.context.state));
  }

  // ── Transport ──────────────────────────────────────────────────────────

  /** Call from every pointer gesture. Drag launches fire from a debounce
   *  timer, which browsers don't treat as a gesture, so unlock up front. */
  unlock() {
    if (Tone.getContext().state !== "running") void Tone.start();
  }

  async start() {
    if (this.ui.playing) return;
    this.setUi("playing", true);
    await Tone.start(); // audio unlock — must run inside a user gesture
    this.ensureGraph();
    const transport = Tone.getTransport();
    transport.bpm.value = this.pack.bpm;
    this.lastScheduled = -1;
    transport.start("+0.05");
  }

  stopAll() {
    Tone.getTransport().stop();
    const now = Tone.now();
    Tone.getDraw().cancel(0); // queued UI updates would re-light cells after stop
    this.voices.forEach((v) => v.silence(now));
    this.lastScheduled = -1;
    this.runtimes.forEach((rt) => Object.assign(rt, { playback: null, pending: null, gated: false }));
    this.voices.forEach((v) => v.output.gain.setValueAtTime(1, now));
    batch(() => {
      this.setUi("playing", false);
      this.setUi("cycleStep", 0);
      this.pack.rows.forEach((_, r) => this.setUi("rows", r, { playing: null, queued: null, stopQueued: false, oneShot: false, progress: 0 }));
    });
  }

  dispose() {
    const transport = Tone.getTransport();
    transport.stop();
    if (this.repeatId !== undefined) transport.clear(this.repeatId);
    this.voices.forEach((v) => v.dispose());
    this.master?.dispose();
    void this.context.close();
  }

  private ensureGraph() {
    if (this.master) return;
    this.master = new Tone.Limiter(-1).toDestination();
    this.voices = this.pack.rows.map((row) => createRowVoice(row, this.master!));
    this.repeatId = Tone.getTransport().scheduleRepeat((time) => this.tick(time), "16n", 0);
  }

  // ── Actions ────────────────────────────────────────────────────────────

  /** Tap: launch, re-tap the playing cell to stop, tap a queued cell to cancel. */
  tap(r: number, c: number) {
    const rt = this.runtimes[r];
    const pending = rt.pending;
    if (pending && pending.kind !== "stop" && pending.cellIndex === c) return this.cancelPending(r);
    const pb = rt.playback;
    if (pb && pb.mode === "loop" && pb.cellIndex === c && !pending) return this.stop(r);
    this.launch(r, c);
  }

  /** Long-press: stop the playing cell immediately (drops), otherwise fire a one-shot. */
  press(r: number, c: number) {
    const pb = this.runtimes[r].playback;
    if (pb && pb.cellIndex === c) return this.stopNow(r);
    this.fireOneShot(r, c);
  }

  launch(r: number, c: number) {
    const rt = this.runtimes[r];
    const pb = rt.playback;
    if (pb?.mode === "oneShot") {
      // Queued behind a one-shot: it becomes what the row reverts to.
      pb.resume = { cellIndex: c, anchor: pb.anchor + this.cellLen(r, pb.cellIndex), mode: "loop", resume: null };
    } else if (pb?.mode === "loop" && pb.cellIndex === c) {
      rt.pending = null;
    } else {
      rt.pending = { kind: "launch", cellIndex: c, at: nextBoundary(this.lastScheduled, this.quantum) };
    }
    this.syncQueue(r);
    if (!this.ui.playing) void this.start();
  }

  stop(r: number) {
    const rt = this.runtimes[r];
    const pb = rt.playback;
    if (pb?.mode === "oneShot") pb.resume = null;
    else if (pb) rt.pending = { kind: "stop", at: nextBoundary(this.lastScheduled, this.quantum) };
    else rt.pending = null;
    this.syncQueue(r);
  }

  stopNow(r: number) {
    const rt = this.runtimes[r];
    rt.playback = null;
    rt.pending = null;
    const voice = this.voices[r];
    if (voice) {
      // Notes inside the lookahead window are already scheduled, so gate the
      // row's output rather than only releasing voices. Reopened on relaunch.
      const now = Tone.now();
      voice.output.gain.cancelScheduledValues(now);
      voice.output.gain.setValueAtTime(voice.output.gain.value, now);
      voice.output.gain.linearRampToValueAtTime(0, now + 0.01);
      voice.silence(now + 0.01);
      rt.gated = true;
    }
    this.setUi("rows", r, { playing: null, oneShot: false, progress: 0 });
    this.syncQueue(r);
  }

  fireOneShot(r: number, c: number) {
    const at = oneShotStart(this.lastScheduled, this.cycle, this.cellLen(r, c));
    this.runtimes[r].pending = { kind: "oneShot", cellIndex: c, at };
    this.syncQueue(r);
    if (!this.ui.playing) void this.start();
  }

  private cancelPending(r: number) {
    this.runtimes[r].pending = null;
    this.syncQueue(r);
  }

  private cellLen(r: number, c: number) {
    return cellLength(this.pack.rows[r].cells[c]);
  }

  private syncQueue(r: number) {
    const rt = this.runtimes[r];
    const p = rt.pending;
    const pb = rt.playback;
    const behindOneShot = pb?.mode === "oneShot" ? pb.resume : undefined;
    this.setUi("rows", r, {
      queued: p && p.kind !== "stop" ? p.cellIndex : behindOneShot ? behindOneShot.cellIndex : null,
      stopQueued: p?.kind === "stop" || (pb?.mode === "oneShot" && !pb.resume),
    });
  }

  private readDiag(): DeckDiag {
    const raw = this.context.rawContext as unknown as AudioContext;
    const diag = {
      state: this.context.state,
      sampleRate: this.context.sampleRate,
      latencyMs: Math.round(((raw.baseLatency ?? 0) + (raw.outputLatency ?? 0)) * 1000),
      headroomMs: Math.round(this.worstLead * 1000),
      lateSteps: this.lateSteps,
      errors: this.errors,
      lastError: this.lastError,
    };
    this.worstLead = Infinity;
    return diag;
  }

  // ── Scheduler ──────────────────────────────────────────────────────────

  private tick(time: number) {
    const transport = Tone.getTransport();
    const step = Math.round(transport.getTicksAtTime(time) / (transport.PPQ / 4));
    this.lastScheduled = step;

    // How far ahead of the audio clock this step is being scheduled. Near or
    // below zero means the main thread can't keep up with the lookahead.
    const lead = time - this.context.currentTime;
    this.worstLead = Math.min(this.worstLead, lead);
    if (lead < 0) this.lateSteps++;

    const cyclePos = mod(step, this.cycle);
    const chord = spineChordAt(this.pack.spine, cyclePos);
    const stepSec = 60 / transport.bpm.value / 4;
    const snapshots: { playing: number | null; oneShot: boolean; progress: number }[] = [];

    this.pack.rows.forEach((row, r) => {
      // One row throwing must not cost every later row its notes for this step.
      try {
      const rt = this.runtimes[r];
      let entered = false;

      if (rt.pending && rt.pending.at <= step) {
        const p = rt.pending;
        rt.pending = null;
        if (p.kind === "stop") {
          rt.playback = null;
        } else if (p.kind === "launch") {
          rt.playback = { cellIndex: p.cellIndex, anchor: step, mode: "loop", resume: null };
          entered = true;
        } else {
          const current = rt.playback;
          const resume = current?.mode === "oneShot" ? current.resume : current;
          rt.playback = { cellIndex: p.cellIndex, anchor: step, mode: "oneShot", resume };
          entered = true;
        }
      }

      const pb = rt.playback;
      if (pb?.mode === "oneShot" && step >= pb.anchor + this.cellLen(r, pb.cellIndex)) {
        // Revert keeps the previous cell's original anchor, so it comes back
        // in phase as if it had never stopped.
        rt.playback = pb.resume;
        entered = true;
      }

      const active = rt.playback;
      if (!active) {
        snapshots[r] = { playing: null, oneShot: false, progress: 0 };
        return;
      }

      const voice = this.voices[r];
      if (entered && rt.gated) {
        voice.output.gain.cancelScheduledValues(time);
        voice.output.gain.setValueAtTime(0, time);
        voice.output.gain.linearRampToValueAtTime(1, time + 0.01);
        rt.gated = false;
      }

      const cell = row.cells[active.cellIndex];
      const len = cellLength(cell);
      const local = localStep(step, active.anchor, len);

      if (row.kind === "pitched") {
        if (entered) {
          for (const { note, remaining } of inFlightAt(row.cells[active.cellIndex].notes, local, len)) {
            voice.play(resolvePitch(row, note.deg, this.key, chord), remaining * stepSec, time, note.v);
          }
        }
        for (const note of this.stepIndex[r][active.cellIndex][local] as PatternNote[]) {
          voice.play(resolvePitch(row, note.deg, this.key, chord), note.dur * stepSec, time, note.v);
        }
      } else {
        for (const hit of this.stepIndex[r][active.cellIndex][local] as DrumHit[]) {
          voice.play(hit.note, stepSec, time, hit.v);
        }
      }

      snapshots[r] = { playing: active.cellIndex, oneShot: active.mode === "oneShot", progress: (local + 1) / len };
      } catch (err) {
        this.errors++;
        this.lastError = err instanceof Error ? err.message : String(err);
        console.error(`[deck] row "${row.id}" failed at step ${step}`, err);
      }
    });

    const diag = cyclePos % STEPS_PER_BAR === 0 ? this.readDiag() : undefined;

    Tone.getDraw().schedule(() => {
      batch(() => {
        this.setUi("cycleStep", cyclePos);
        snapshots.forEach((s, r) => {
          this.setUi("rows", r, s);
          this.syncQueue(r);
        });
        if (diag) this.setUi("diag", diag);
      });
    }, time);
  }
}
