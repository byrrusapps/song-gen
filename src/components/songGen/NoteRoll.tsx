import { createMemo, For, Show } from "solid-js";
import type { NoteEvent } from "../../types/midi/Song";
import { gmEntryForNote } from "../../utils/midi/gmPercussion";
import { pitchExtent } from "../../utils/midi/performanceView";

interface NoteRollProps {
  notes: NoteEvent[];
  startSeconds: number;
  endSeconds: number;
  bars: number;
  beatsPerBar?: number;
  isDrum?: boolean;
  label?: string;
  sublabel?: string;
  presence?: number[];
  onDownload?: () => void;
}

const PX_PER_BAR = 128;
const LABEL_WIDTH = 96;
const PITCH_LANE_PX = 10;
const DRUM_LANE_PX = 24;
const MAX_BODY_PX = 340;
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export function NoteRoll(props: NoteRollProps) {
  const beatsPerBar = () => props.beatsPerBar ?? 4;
  const duration = () => Math.max(0.001, props.endSeconds - props.startSeconds);
  const rollWidth = () => Math.max(1, props.bars) * PX_PER_BAR;
  const isSilent = () => props.notes.length === 0;

  const drumLanes = createMemo(() => {
    if (!props.isDrum) return [];
    const seen = new Map<number, { midi: number; label: string }>();
    for (const n of props.notes) {
      if (seen.has(n.midi)) continue;
      seen.set(n.midi, { midi: n.midi, label: gmEntryForNote(n.midi)?.label ?? `Note ${n.midi}` });
    }
    return [...seen.values()].sort((a, b) => a.midi - b.midi);
  });

  const extent = createMemo(() => pitchExtent(props.notes));
  const pitchLanes = createMemo(() => {
    if (props.isDrum) return [];
    const { low, high } = extent();
    const lanes: number[] = [];
    for (let midi = high; midi >= low; midi--) lanes.push(midi);
    return lanes;
  });

  const bodyHeight = () =>
    props.isDrum
      ? Math.max(1, drumLanes().length) * DRUM_LANE_PX
      : Math.max(1, pitchLanes().length) * PITCH_LANE_PX;

  // Note width is real duration — a sustained part reads as one long bar.
  const geometry = (note: NoteEvent) => {
    const left = ((note.time - props.startSeconds) / duration()) * rollWidth();
    const raw = (note.duration / duration()) * rollWidth();
    return { left, width: Math.max(3, Math.min(raw, rollWidth() - left)) };
  };

  const lanePosition = (note: NoteEvent) =>
    props.isDrum
      ? {
          top: Math.max(0, drumLanes().findIndex((l) => l.midi === note.midi)) * DRUM_LANE_PX + 5,
          height: DRUM_LANE_PX - 10,
        }
      : { top: (extent().high - note.midi) * PITCH_LANE_PX + 2, height: PITCH_LANE_PX - 3 };

  const avgPresence = createMemo(() => {
    const p = props.presence;
    return p?.length ? p.reduce((a, b) => a + b, 0) / p.length : null;
  });

  // Longest note in beats — the quickest read on whether a part is clipped.
  const longestBeats = createMemo(() => {
    if (!props.notes.length) return 0;
    const secPerBeat = duration() / Math.max(1, props.bars) / beatsPerBar();
    return Math.max(...props.notes.map((n) => n.duration)) / secPerBeat;
  });

  return (
    <article class="w-full rounded-[0.75rem] border border-outline-variant bg-surface-container-low overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-medium text-on-surface">{props.label ?? "Track"}</span>
          <Show when={props.sublabel}>
            <span class="truncate text-xs text-on-surface-variant">{props.sublabel}</span>
          </Show>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Show when={avgPresence() !== null}>
            <span class="rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant">
              {Math.round((avgPresence() ?? 0) * 100)}% present
            </span>
          </Show>
          <Show when={!isSilent() && !props.isDrum}>
            <span
              class="rounded-full px-2.5 py-1 text-xs"
              classList={{
                "bg-error-container text-on-error-container": longestBeats() < 0.6,
                "bg-surface-container-high text-on-surface-variant": longestBeats() >= 0.6,
              }}
              title="Longest note in this section, in beats"
            >
              {longestBeats().toFixed(1)} beats
            </span>
          </Show>
          <span class="rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant">
            {props.notes.length}
          </span>
          <Show when={props.onDownload}>
            <md-icon-button
              on:click={() => props.onDownload?.()}
              title={`Download ${props.label} stem`}
            >
              <span class="material-symbols-rounded text-on-surface-variant">download</span>
            </md-icon-button>
          </Show>
        </div>
      </div>

      <Show when={props.presence && props.presence.length > 1}>
        <div class="flex h-6 items-end gap-px px-4 pb-3">
          <For each={props.presence}>
            {(p, i) => (
              <div
                class="flex-1 rounded-t-[2px] bg-on-surface-variant"
                style={{ height: `${Math.max(6, p * 100)}%`, opacity: `${Math.max(0.2, p)}` }}
                title={`Bar ${i() + 1}: ${Math.round(p * 100)}% present`}
              />
            )}
          </For>
        </div>
      </Show>

      <Show
        when={!isSilent()}
        fallback={
          <div class="mx-4 mb-4 flex h-16 items-center justify-center rounded-[0.5rem] border border-dashed border-outline-variant text-xs text-on-surface-variant">
            Silent in this section
          </div>
        }
      >
        <div
          class="overflow-auto border-t border-outline-variant bg-surface-container-lowest"
          style={{ "max-height": `${MAX_BODY_PX}px` }}
        >
          <div style={{ width: `${LABEL_WIDTH + rollWidth()}px` }}>
            {/* Bar ruler — sticks to the top while scrolling vertically */}
            <div class="sticky top-0 z-20 flex border-b border-outline-variant bg-surface-container-lowest">
              <div
                class="sticky left-0 z-30 shrink-0 bg-surface-container-lowest"
                style={{ width: `${LABEL_WIDTH}px` }}
              />
              <div class="flex" style={{ width: `${rollWidth()}px` }}>
                <For each={Array.from({ length: props.bars }, (_, i) => i + 1)}>
                  {(bar) => (
                    <div
                      class="shrink-0 border-l border-outline-variant py-1 pl-2 text-xs text-on-surface-variant"
                      style={{ width: `${PX_PER_BAR}px` }}
                    >
                      {bar}
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="flex">
              {/* Lane labels — stick to the left while scrolling horizontally */}
              <div
                class="sticky left-0 z-10 shrink-0 border-r border-outline-variant bg-surface-container-lowest"
                style={{ width: `${LABEL_WIDTH}px`, height: `${bodyHeight()}px` }}
              >
                <Show
                  when={props.isDrum}
                  fallback={
                    <div class="relative h-full">
                      <For each={pitchLanes()}>
                        {(midi, i) => (
                          <Show when={midi % 12 === 0}>
                            <span
                              class="absolute right-2 text-[10px] text-on-surface-variant"
                              style={{ top: `${i() * PITCH_LANE_PX - 4}px` }}
                            >
                              {noteName(midi)}
                            </span>
                          </Show>
                        )}
                      </For>
                    </div>
                  }
                >
                  <For each={drumLanes()}>
                    {(lane) => (
                      <div
                        class="flex items-center justify-end truncate px-2 text-xs text-on-surface-variant"
                        style={{ height: `${DRUM_LANE_PX}px` }}
                      >
                        {lane.label}
                      </div>
                    )}
                  </For>
                </Show>
              </div>

              {/* Roll body */}
              <div class="relative shrink-0" style={{ width: `${rollWidth()}px`, height: `${bodyHeight()}px` }}>
                <Show when={!props.isDrum}>
                  <For each={pitchLanes()}>
                    {(midi, i) => (
                      <Show when={BLACK_KEYS.has(midi % 12)}>
                        <div
                          class="absolute inset-x-0 bg-surface-container/50"
                          style={{ top: `${i() * PITCH_LANE_PX}px`, height: `${PITCH_LANE_PX}px` }}
                        />
                      </Show>
                    )}
                  </For>
                </Show>
                <Show when={props.isDrum}>
                  <For each={drumLanes()}>
                    {(_, i) => (
                      <Show when={i() % 2 === 1}>
                        <div
                          class="absolute inset-x-0 bg-surface-container/40"
                          style={{ top: `${i() * DRUM_LANE_PX}px`, height: `${DRUM_LANE_PX}px` }}
                        />
                      </Show>
                    )}
                  </For>
                </Show>

                <For each={Array.from({ length: props.bars * beatsPerBar() }, (_, i) => i)}>
                  {(beat) => (
                    <div
                      class="absolute inset-y-0 w-px"
                      classList={{
                        "bg-outline-variant": beat % beatsPerBar() === 0,
                        "bg-outline-variant/40": beat % beatsPerBar() !== 0,
                      }}
                      style={{ left: `${(beat / beatsPerBar()) * PX_PER_BAR}px` }}
                    />
                  )}
                </For>

                <For each={props.notes}>
                  {(note) => {
                    const geo = geometry(note);
                    const lane = lanePosition(note);
                    return (
                      <div
                        class="absolute rounded-[3px] bg-on-surface"
                        style={{
                          left: `${geo.left}px`,
                          width: `${geo.width}px`,
                          top: `${lane.top}px`,
                          height: `${lane.height}px`,
                          opacity: `${Math.max(0.3, note.velocity)}`,
                        }}
                        title={`${props.isDrum ? gmEntryForNote(note.midi)?.label ?? note.midi : noteName(note.midi)} · ${note.duration.toFixed(2)}s · velocity ${Math.round(note.velocity * 100)}`}
                      />
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </article>
  );
}