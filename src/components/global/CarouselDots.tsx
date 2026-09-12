import { For, Show } from "solid-js";

type CarouselDotsSize = "sm" | "md" | "lg";
type CarouselDotsColor = "primary" | "secondary" | "tertiary";

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  size?: CarouselDotsSize;
  color?: CarouselDotsColor;
  ariaLabel?: string;
  class?: string;
}

const sizeMap: Record<CarouselDotsSize, { active: string; inactive: string; hit: string }> = {
  sm: {
    active: "w-3.5 h-1",
    inactive: "w-1 h-1",
    hit: "py-2.5",
  },
  md: {
    active: "w-5 h-1.5",
    inactive: "w-1.5 h-1.5",
    hit: "py-3",
  },
  lg: {
    active: "w-7 h-2",
    inactive: "w-2 h-2",
    hit: "py-3.5",
  },
};

const colorMap: Record<CarouselDotsColor, { active: string; inactive: string }> = {
  primary: {
    active: "bg-primary",
    inactive: "bg-outline-variant",
  },
  secondary: {
    active: "bg-secondary",
    inactive: "bg-outline-variant",
  },
  tertiary: {
    active: "bg-tertiary",
    inactive: "bg-outline-variant",
  },
};

export default function CarouselDots(props: CarouselDotsProps) {
  const size = () => props.size ?? "md";
  const color = () => props.color ?? "primary";

  const handleKeyDown = (e: KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onSelect(i); }
    if (e.key === "ArrowLeft" && i > 0) props.onSelect(i - 1);
    if (e.key === "ArrowRight" && i < props.count - 1) props.onSelect(i + 1);
    if (e.key === "Home") props.onSelect(0);
    if (e.key === "End") props.onSelect(props.count - 1);
  };

  return (
    <Show when={props.count > 1}>
      <div
        role="tablist"
        aria-label={props.ariaLabel ?? "Carousel navigation"}
        class={`flex items-center justify-center py-2 gap-2 ${props.class ?? ""}`}
      >
        <For each={Array.from({ length: props.count }, (_, i) => i)}>
          {(i) => {
            const isActive = () => i === props.activeIndex;
            const sizes = () => sizeMap[size()];
            const colors = () => colorMap[color()];

            return (
              <button
                role="tab"
                aria-selected={isActive()}
                aria-label={`Slide ${i + 1} of ${props.count}`}
                tabIndex={isActive() ? 0 : -1}
                onClick={() => props.onSelect(i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                class={[
                  // Hit area (min 48x48 touch target via padding)
                  sizes().hit,
                  "relative flex items-center justify-center",
                  "rounded-full cursor-pointer",
                  "border-none bg-transparent outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  // State layer on hover
                  "group",
                ].join(" ")}
              >
                {/* State layer */}
                <span
                  aria-hidden="true"
                  class={[
                    "absolute inset-0 rounded-full",
                    "bg-on-surface opacity-0",
                    "group-hover:opacity-[0.08]",
                    "group-active:opacity-[0.12]",
                    "transition-opacity duration-200",
                    "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
                  ].join(" ")}
                />

                {/* Dot */}
                <span
                  aria-hidden="true"
                  class={[
                    isActive() ? sizes().active : sizes().inactive,
                    isActive() ? "rounded-full" : "rounded-full",
                    isActive() ? colors().active : colors().inactive,
                    "block transition-all duration-300",
                    "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
                  ].join(" ")}
                />
              </button>
            );
          }}
        </For>
      </div>
    </Show>
  );
}