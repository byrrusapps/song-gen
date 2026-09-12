import { For, Show } from "solid-js";
import type { Phrase } from "../../types/midi/Song";

const DEGREE_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function PhraseStrip(props: { phrases: Phrase[]; activeId?: string }) {
  return (
    <div class="flex flex-col gap-3">
      <For each={props.phrases}>
        {(phrase) => (
          <div
            class="flex flex-wrap items-center gap-2 rounded-[0.75rem] border px-3 py-2.5"
            classList={{
              "border-outline bg-surface-container-high": props.activeId === phrase.id,
              "border-outline-variant bg-surface-container-low": props.activeId !== phrase.id,
            }}
          >
            <span class="w-14 shrink-0 truncate text-xs text-on-surface-variant">{phrase.id}</span>
            <For each={phrase.bars}>
              {(chord) => (
                <span class="rounded-[0.5rem] bg-surface-container-highest px-2.5 py-1 text-xs text-on-surface">
                  {DEGREE_NUMERALS[chord.degree] ?? chord.degree}
                  <span class="text-on-surface-variant">{chord.quality}</span>
                  <Show when={chord.inversion}>
                    <span class="text-on-surface-variant">/{chord.inversion}</span>
                  </Show>
                </span>
              )}
            </For>
            <span class="ml-auto text-xs text-on-surface-variant">{phrase.cadence}</span>
          </div>
        )}
      </For>
    </div>
  );
}