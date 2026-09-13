import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { DeckEngine } from "../../lib/deck/engine";
import { renderBench, runBench } from "../../lib/deck/bench";
import { DEMO_PACK } from "../../config/deck/demoPack";
import { STEPS_PER_BAR } from "../../types/deck/Pack";

const LONG_PRESS_MS = 450;
const DRAG_DEBOUNCE_MS = 80; // last cell entered in a row within this window wins (spec §10)
const ENERGY_LABELS = ["Sparse", "Build", "Groove", "Full"];

type CellRef = [row: number, col: number];

export default function Deck() {
  const engine = new DeckEngine(DEMO_PACK);
  onCleanup(() => engine.dispose());

  const ui = engine.ui;
  const pack = engine.pack;
  const cycleBars = engine.cycle / STEPS_PER_BAR;

  // ?bench=N measures live playback, ?render=N the voices' audio-thread cost.
  const [bench, setBench] = createSignal<object | null>(null);
  onMount(() => {
    const params = new URLSearchParams(location.search);
    const secs = Number(params.get("secs")) || 20;
    const live = Number(params.get("bench"));
    const render = Number(params.get("render"));
    if (live > 0) void runBench(engine, live, secs).then(setBench);
    else if (render > 0) void renderBench(pack, render, secs).then(setBench);
  });

  // ── Gesture state ──────────────────────────────────────────────────────
  // The grid captures the pointer, so pointerenter never fires on sibling
  // cells (touch pointers capture implicitly anyway). Cell rects are measured
  // once per gesture and hit-tested arithmetically — no layout per move.
  let grid!: HTMLDivElement;
  let cellRects: { cell: CellRef; rect: DOMRect }[] = [];
  let start: CellRef | null = null;
  let current: CellRef | null = null;
  let dragging = false;
  let longPressed = false;
  let pressTimer: number | undefined;
  const rowTimers = new Map<number, number>();

  const measureCells = () => {
    cellRects = [...grid.querySelectorAll<HTMLElement>("[data-cell]")].map((el) => ({
      cell: [Number(el.dataset.row), Number(el.dataset.col)],
      rect: el.getBoundingClientRect(),
    }));
  };

  const cellAt = (x: number, y: number): CellRef | null =>
    cellRects.find(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)?.cell ?? null;

  // A sweep is a run of fast taps: cells it lands on toggle, so sweeping a
  // column launches the idle rows and stops the playing ones.
  const enterDebounced = ([r, c]: CellRef) => {
    clearTimeout(rowTimers.get(r));
    rowTimers.set(r, window.setTimeout(() => {
      rowTimers.delete(r);
      engine.tap(r, c);
    }, DRAG_DEBOUNCE_MS));
  };

  const reset = () => {
    clearTimeout(pressTimer);
    start = current = null;
    dragging = longPressed = false;
  };

  function onPointerDown(e: PointerEvent) {
    engine.unlock();
    measureCells();
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    grid.setPointerCapture(e.pointerId);
    start = current = cell;
    pressTimer = window.setTimeout(() => {
      if (dragging || !start) return;
      longPressed = true;
      navigator.vibrate?.(12);
      engine.press(...start);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: PointerEvent) {
    if (!start || longPressed) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell || (current && cell[0] === current[0] && cell[1] === current[1])) return;
    if (!dragging) {
      // First move off the starting cell turns the gesture into a sweep,
      // and the cell the finger started on counts as entered.
      dragging = true;
      clearTimeout(pressTimer);
      enterDebounced(start);
    }
    current = cell;
    enterDebounced(cell);
  }

  function onPointerUp() {
    engine.unlock();
    if (start && !dragging && !longPressed) engine.tap(...start);
    reset();
  }

  /** The browser took the gesture over: drop the sweep's pending taps too. */
  function onPointerCancel() {
    rowTimers.forEach((t) => clearTimeout(t));
    rowTimers.clear();
    reset();
  }

  onCleanup(() => {
    clearTimeout(pressTimer);
    rowTimers.forEach((t) => clearTimeout(t));
  });

  const quantumFill = (q: number) =>
    ui.playing ? Math.min(1, Math.max(0, (ui.cycleStep + 1 - q * engine.quantum) / engine.quantum)) : 0;

  return (
    <>
      <header class="sticky top-0 left-0 z-50 w-full box-border flex items-center justify-between gap-4 border-b border-outline-variant bg-background/80 p-4 backdrop-blur-md lg:px-16">
        <div class="flex flex-col">
          <span class="font-brand font-semibold text-on-surface">{pack.title}</span>
          <span class="text-xs text-on-surface-variant">
            {pack.key} · {pack.bpm} BPM · {cycleBars}-bar cycle
          </span>
        </div>
        <md-filled-icon-button on:click={() => (ui.playing ? engine.stopAll() : void engine.start())}>
          <span class="material-symbols-rounded">{ui.playing ? "stop" : "play_arrow"}</span>
        </md-filled-icon-button>
      </header>

      <main class="relative box-border flex w-full flex-col items-center gap-6 p-4 pb-24 lg:px-16">
        <section class="relative box-border flex w-full flex-col gap-4 rounded-[1rem] bg-surface-container px-4 py-6 lg:w-3xl">
          {/* ── Cycle ──────────────────────────────────────────────── */}
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-xs text-on-surface-variant">
              <span>Cycle</span>
              <span>
                Bar {ui.playing ? Math.floor(ui.cycleStep / STEPS_PER_BAR) + 1 : 1} / {cycleBars}
              </span>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <For each={[0, 1, 2, 3]}>
                {(q) => (
                  <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                    <div class="h-full origin-left bg-primary will-change-transform" style={{ transform: `scaleX(${quantumFill(q)})` }} />
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* ── Grid ───────────────────────────────────────────────── */}
          <div class="grid grid-cols-[5rem_repeat(4,minmax(0,1fr))] gap-2 text-xs text-on-surface-variant">
            <span />
            <For each={ENERGY_LABELS}>{(label) => <span class="text-center">{label}</span>}</For>
          </div>

          <div
            ref={grid}
            class="flex select-none flex-col gap-2"
            style={{ "touch-action": "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <For each={pack.rows}>
              {(row, r) => (
                <div class="grid grid-cols-[5rem_repeat(4,minmax(0,1fr))] gap-2">
                  <div class="flex min-w-0 flex-col justify-center">
                    <span class="truncate text-sm font-medium text-on-surface">{row.name}</span>
                    <span class="truncate text-xs text-on-surface-variant">
                      {row.kind === "drums" ? "GM kit" : row.harmony === "chord" ? "follows chords" : "melody"}
                    </span>
                  </div>

                  <For each={row.cells}>
                    {(cell, c) => {
                      const state = () => ui.rows[r()];
                      const playing = () => state().playing === c();
                      const oneShot = () => playing() && state().oneShot;
                      const queued = () => state().queued === c();
                      const stopping = () => playing() && state().stopQueued;

                      return (
                        <div
                          data-cell
                          data-row={r()}
                          data-col={c()}
                          class="relative box-border flex h-16 items-end overflow-hidden rounded-[0.75rem] border-2 p-2 transition-colors"
                          classList={{
                            "bg-primary-container text-on-primary-container border-primary": playing() && !oneShot(),
                            "bg-tertiary-container text-on-tertiary-container border-tertiary": oneShot(),
                            "bg-surface-container-high text-on-surface-variant": !playing(),
                            "border-transparent": !playing() && !queued(),
                            "border-dashed border-primary animate-pulse": queued(),
                            "border-dashed !border-error": stopping(),
                          }}
                        >
                          <div
                            class="pointer-events-none absolute inset-0 origin-left bg-primary/20 will-change-transform"
                            style={{ transform: `scaleX(${playing() ? state().progress : 0})` }}
                          />
                          <span class="pointer-events-none relative">
                            {cell.bars} {cell.bars === 1 ? "bar" : "bars"}
                          </span>
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}
            </For>
          </div>

          <p class="text-xs text-on-surface-variant">
            Tap or sweep to launch and stop · hold for a one-shot, or hold a playing cell to stop it now
          </p>
        </section>

        {/* ── Diagnostics — for devices without a console attached ─── */}
        <details class="box-border w-full rounded-[0.75rem] border border-outline-variant bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant lg:w-3xl">
          <summary class="cursor-pointer">
            Audio diagnostics
            <Show when={ui.diag.errors || ui.diag.lateSteps}>
              <span class="ml-2 rounded-full bg-error-container px-2 py-0.5 text-on-error-container">
                {ui.diag.errors} errors · {ui.diag.lateSteps} late
              </span>
            </Show>
          </summary>
          <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt>Audio context</dt>
            <dd class="text-on-surface">{ui.diag.state}</dd>
            <dt>Sample rate</dt>
            <dd class="text-on-surface">{ui.diag.sampleRate} Hz</dd>
            <dt>Output latency</dt>
            <dd class="text-on-surface">{ui.diag.latencyMs} ms</dd>
            <dt>Scheduler headroom</dt>
            <dd class="text-on-surface">{ui.diag.headroomMs} ms (worst in last bar; should stay well above 0)</dd>
            <dt>Late steps</dt>
            <dd class="text-on-surface">{ui.diag.lateSteps}</dd>
            <dt>Scheduler errors</dt>
            <dd class="text-on-surface">{ui.diag.errors}</dd>
            <Show when={ui.diag.lastError}>
              <dt>Last error</dt>
              <dd class="break-all text-error">{ui.diag.lastError}</dd>
            </Show>
          </dl>
        </details>

        <Show when={bench()}>
          {(result) => (
            <pre id="bench-result" class="box-border w-full overflow-x-auto rounded-[0.75rem] bg-surface-container-low p-4 text-xs text-on-surface lg:w-3xl">
              {JSON.stringify(result(), null, 2)}
            </pre>
          )}
        </Show>
      </main>
    </>
  );
}
