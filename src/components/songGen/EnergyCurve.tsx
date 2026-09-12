import { For } from "solid-js";
import type { Section } from "../../types/midi/Song";

interface EnergyCurveProps {
  sections: Section[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export function EnergyCurve(props: EnergyCurveProps) {
  return (
    <div class="flex w-full items-end gap-1">
      <For each={props.sections}>
        {(section) => {
          const active = () => props.activeId === section.id;
          return (
            <button
              type="button"
              onClick={() => props.onSelect(section.id)}
              class="relative flex flex-1 flex-col items-center gap-2 rounded-[0.5rem] px-1 pb-1 pt-2"
              title={`${section.name} · ${Math.round((section.energy ?? 0) * 100)}% energy`}
            >
              <div class="flex h-20 w-full items-end">
                <div
                  class="w-full rounded-t-[0.25rem] transition-all"
                  classList={{
                    "bg-primary": active(),
                    "bg-on-surface-variant/35": !active(),
                  }}
                  style={{ height: `${Math.max(6, (section.energy ?? 0) * 100)}%` }}
                />
              </div>
              <span
                class="w-full truncate text-center text-xs"
                classList={{
                  "text-on-surface font-medium": active(),
                  "text-on-surface-variant": !active(),
                }}
              >
                {section.name}
              </span>
              <md-ripple />
            </button>
          );
        }}
      </For>
    </div>
  );
}