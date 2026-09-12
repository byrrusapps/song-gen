import { For, Show, type JSX } from "solid-js";

type ColumnsConfig = number | {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

interface MasonryLayoutProps<T = any> {
  items?: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  columns?: ColumnsConfig;
  gap?: string;
  loading?: boolean;
  renderSkeleton?: (index: number) => JSX.Element;
  skeletonCount?: number;
  class?: string;
}

// Full literal strings so Tailwind's scanner finds every class
const COL: Record<string, Record<number, string>> = {
  "":    { 1: "columns-1",    2: "columns-2",    3: "columns-3",    4: "columns-4",    5: "columns-5",    6: "columns-6"    },
  "sm:": { 1: "sm:columns-1", 2: "sm:columns-2", 3: "sm:columns-3", 4: "sm:columns-4", 5: "sm:columns-5", 6: "sm:columns-6" },
  "md:": { 1: "md:columns-1", 2: "md:columns-2", 3: "md:columns-3", 4: "md:columns-4", 5: "md:columns-5", 6: "md:columns-6" },
  "lg:": { 1: "lg:columns-1", 2: "lg:columns-2", 3: "lg:columns-3", 4: "lg:columns-4", 5: "lg:columns-5", 6: "lg:columns-6" },
  "xl:": { 1: "xl:columns-1", 2: "xl:columns-2", 3: "xl:columns-3", 4: "xl:columns-4", 5: "xl:columns-5", 6: "xl:columns-6" },
};

function buildColClass(columns: ColumnsConfig): string {
  if (typeof columns === "number") {
    return COL[""][Math.min(6, Math.max(1, columns))] ?? "columns-1";
  }
  return [
    columns.xs != null && COL[""][columns.xs],
    columns.sm != null && COL["sm:"][columns.sm],
    columns.md != null && COL["md:"][columns.md],
    columns.lg != null && COL["lg:"][columns.lg],
    columns.xl != null && COL["xl:"][columns.xl],
  ].filter(Boolean).join(" ");
}

export default function MasonryLayout<T = any>(props: MasonryLayoutProps<T>) {
  const colClass = () => buildColClass(props.columns ?? { xs: 1, sm: 2, md: 2, lg: 3 });
  const gap = () => props.gap ?? "8px";

  return (
    <div
      class={`w-full ${colClass()} ${props.class ?? ""}`}
      style={{ "column-gap": gap() }}
    >
      <For each={props.items ?? []}>
        {(item, i) => (
          <div
            class="break-inside-avoid w-full"
            style={{ "margin-bottom": gap() }}
          >
            {props.renderItem(item, i())}
          </div>
        )}
      </For>

      <Show when={props.loading}>
        <For each={Array.from({ length: props.skeletonCount ?? 6 }, (_, i) => i)}>
          {(i) => (
            <div
              class="break-inside-avoid w-full"
              style={{ "margin-bottom": gap() }}
            >
              {props.renderSkeleton?.(i)}
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}