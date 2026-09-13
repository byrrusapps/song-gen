import * as Tone from "tone";
import type { DeckEngine } from "./engine";
import { createRowVoice } from "./instruments";
import { STEPS_PER_BAR, type Pack } from "../../types/deck/Pack";
import { cycleSteps } from "../../utils/deck/timing";
import { keyContext, resolvePitch, spineChordAt } from "../../utils/deck/pitch";

export interface RenderBenchResult {
  rows: number;
  seconds: number;
  renderMs: number;
  realtimeX: number;          // how many times faster than real time the voices render
}

/** Audio-thread cost of the voices alone: plays the Full column of the first
 *  `rows` rows through Tone.Offline and times the render. Open
 *  /deck?render=6&secs=20. Real-time playback needs comfortable margin over
 *  1× — phones are several times slower than the machine measured here. */
export async function renderBench(pack: Pack, rows: number, seconds: number): Promise<RenderBenchResult> {
  const chosen = pack.rows.slice(0, rows);
  const key = keyContext(pack);
  const cycle = cycleSteps(pack.rows.flatMap((r) => r.cells.map((c) => c.bars)));
  const started = performance.now();

  await Tone.Offline((context) => {
    const transport = context.transport;
    transport.bpm.value = pack.bpm;
    const stepSec = 60 / pack.bpm / 4;
    const voices = chosen.map((row) => createRowVoice(row, context.destination));
    let step = 0;
    transport.scheduleRepeat((time) => {
      const chord = spineChordAt(pack.spine, step % cycle);
      chosen.forEach((row, r) => {
        const cell = row.cells[FULL_COLUMN];
        const local = step % (cell.bars * STEPS_PER_BAR);
        if (row.kind === "pitched") {
          for (const n of row.cells[FULL_COLUMN].notes) {
            if (n.step === local) voices[r].play(resolvePitch(row, n.deg, key, chord), n.dur * stepSec, time, n.v);
          }
        } else {
          for (const h of row.cells[FULL_COLUMN].hits) if (h.step === local) voices[r].play(h.note, stepSec, time, h.v);
        }
      });
      step++;
    }, "16n", 0);
    transport.start(0);
  }, seconds);

  const renderMs = performance.now() - started;
  return { rows: chosen.length, seconds, renderMs: Math.round(renderMs), realtimeX: Math.round((seconds * 1000 / renderMs) * 10) / 10 };
}

// Row-count benchmark (spec §11: benchmark before committing to 8 rows).
// Open /deck?bench=6&secs=20 — the browser must allow audio without a
// gesture (headless: --autoplay-policy=no-user-gesture-required), or tap once.

export interface BenchResult {
  rows: number;
  seconds: number;
  longTasks: number;          // main-thread tasks over 50 ms
  longTaskMs: number;
  worstLongTaskMs: number;
  worstHeadroomMs: number;    // least lead the scheduler kept over the audio clock
  lateSteps: number;
  errors: number;
  playout: unknown;           // browser underrun stats, where exposed
}

const FULL_COLUMN = 3;

export async function runBench(engine: DeckEngine, rows: number, seconds: number): Promise<BenchResult> {
  const tasks: number[] = [];
  const observer = new PerformanceObserver((list) => list.getEntries().forEach((e) => tasks.push(e.duration)));
  try {
    observer.observe({ type: "longtask" });
  } catch {
    // longtask isn't supported everywhere; the scheduler numbers still stand.
  }

  const count = Math.min(rows, engine.pack.rows.length);
  for (let r = 0; r < count; r++) engine.launch(r, FULL_COLUMN);

  // Headroom is reported once per bar; skip the first bar while it warms up.
  let worstHeadroom = Infinity;
  const warmup = Date.now() + 3000;
  const poll = window.setInterval(() => {
    if (Date.now() > warmup) worstHeadroom = Math.min(worstHeadroom, engine.ui.diag.headroomMs);
  }, 250);

  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  clearInterval(poll);
  observer.disconnect();

  const raw = Tone.getContext().rawContext as unknown as { playoutStats?: { toJSON?: () => unknown } };
  const result: BenchResult = {
    rows: count,
    seconds,
    longTasks: tasks.length,
    longTaskMs: Math.round(tasks.reduce((a, b) => a + b, 0)),
    worstLongTaskMs: Math.round(Math.max(0, ...tasks)),
    worstHeadroomMs: worstHeadroom,
    lateSteps: engine.ui.diag.lateSteps,
    errors: engine.ui.diag.errors,
    playout: raw.playoutStats?.toJSON?.() ?? null,
  };
  engine.stopAll();
  return result;
}
