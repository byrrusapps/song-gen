import { createSignal, createMemo, createEffect, For, Show, batch } from "solid-js";

// ── Color math ────────────────────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max ? d / max : 0, max];
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hueToHex(h: number): string {
  return hsvToHex(h, 1, 1);
}

function isValidHex(s: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(s);
}

function normalizeHex(s: string): string {
  return s.startsWith("#") ? s : `#${s}`;
}

// ── Drag helper ───────────────────────────────────────────────────────────────

function useDrag(onMove: (e: PointerEvent) => void) {
  let active = false;
  function start(e: PointerEvent) {
    active = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onMove(e);
  }
  function move(e: PointerEvent) { if (active) onMove(e); }
  function end()                  { active = false; }
  return { onPointerDown: start, onPointerMove: move, onPointerUp: end };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Preset = { name: string; value: string };
type Props  = { value: string; presets: Preset[]; onSelect: (hex: string) => void };

// ── Component ─────────────────────────────────────────────────────────────────

export function ColorPicker(props: Props) {
  // Internal HSV state — source of truth while dragging
  const [h, setH] = createSignal(0);
  const [s, setS] = createSignal(1);
  const [v, setV] = createSignal(1);
  const [hexInput, setHexInput] = createSignal("");

  // Sync inward when props.value changes externally (preset click, etc.)
  createEffect(() => {
    if (!isValidHex(props.value)) return;
    const [nh, ns, nv] = hexToHsv(normalizeHex(props.value));
    batch(() => { setH(nh); setS(ns); setV(nv); });
    setHexInput(normalizeHex(props.value).slice(1).toUpperCase());
  });

  // Derived hex from internal HSV
  const currentHex = createMemo(() => hsvToHex(h(), s(), v()));

  // Emit on every internal change
  createEffect(() => props.onSelect(currentHex()));

  // Pure hue colour for the SV gradient bg
  const hueBg = createMemo(() => hueToHex(h()));

  // ── SV canvas drag ────────────────────────────────────────────────
  let svEl: HTMLDivElement | undefined;
  const svDrag = useDrag((e) => {
    if (!svEl) return;
    const { left, top, width, height } = svEl.getBoundingClientRect();
    setS(Math.max(0, Math.min(1, (e.clientX - left) / width)));
    setV(Math.max(0, Math.min(1, 1 - (e.clientY - top) / height)));
    setHexInput(currentHex().slice(1).toUpperCase());
  });

  // ── Hue slider drag ───────────────────────────────────────────────
  let hueEl: HTMLDivElement | undefined;
  const hueDrag = useDrag((e) => {
    if (!hueEl) return;
    const { left, width } = hueEl.getBoundingClientRect();
    setH(Math.max(0, Math.min(360, ((e.clientX - left) / width) * 360)));
    setHexInput(currentHex().slice(1).toUpperCase());
  });

  // ── Hex input ─────────────────────────────────────────────────────
  function onHexInput(raw: string) {
    const clean = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexInput(clean.toUpperCase());
    if (clean.length === 6) {
      const [nh, ns, nv] = hexToHsv(`#${clean}`);
      batch(() => { setH(nh); setS(ns); setV(nv); });
    }
  }

  // ── Thumb position ────────────────────────────────────────────────
  const thumbLeft = createMemo(() => `${s() * 100}%`);
  const thumbTop  = createMemo(() => `${(1 - v()) * 100}%`);
  const hueLeft   = createMemo(() => `${(h() / 360) * 100}%`);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div class="flex flex-col gap-4">

      {/* ── SV canvas ── */}
      <div
        ref={svEl}
        class="relative w-full rounded-xl overflow-hidden cursor-crosshair select-none"
        style={{ height: "180px" }}
        {...svDrag}
      >
        {/* Base hue */}
        <div class="absolute inset-0" style={{ background: hueBg() }} />
        {/* White → transparent (left → right) */}
        <div class="absolute inset-0" style={{ background: "linear-gradient(to right, #fff 0%, transparent 100%)" }} />
        {/* Black → transparent (bottom → top) */}
        <div class="absolute inset-0" style={{ background: "linear-gradient(to top, #000 0%, transparent 100%)" }} />

        {/* Crosshair thumb */}
        <div
          class="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: thumbLeft(),
            top:  thumbTop(),
            background: currentHex(),
            "box-shadow": "0 0 0 1.5px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* ── Hue slider ── */}
      <div
        ref={hueEl}
        class="relative w-full h-3 rounded-full cursor-pointer select-none"
        style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
        {...hueDrag}
      >
        <div
          class="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: hueLeft(),
            background: hueBg(),
            "box-shadow": "0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* ── Hex input + preview swatch ── */}
      <div class="flex items-center gap-2">
        {/* Live swatch */}
        <div
          class="w-9 h-9 rounded-lg border border-outline-variant shrink-0 shadow-sm"
          style={{ background: currentHex() }}
        />

        {/* Hex field */}
        <div class="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant
          bg-transparent hover:border-outline focus-within:border-primary transition-colors">
          <span class="text-xs text-on-surface-variant font-mono">#</span>
          <input
            type="text"
            maxlength={6}
            value={hexInput()}
            onInput={(e) => onHexInput(e.currentTarget.value)}
            class="flex-1 bg-transparent text-sm font-mono text-on-surface outline-none uppercase"
            placeholder="6750A4"
            aria-label="Hex colour value"
            spellcheck={false}
          />
        </div>
      </div>

      {/* ── Presets ── */}
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour presets">
        <For each={props.presets}>
          {(preset) => {
            const isActive = () =>
              currentHex().toLowerCase() === preset.value.toLowerCase();
            return (
              <button
                type="button"
                role="radio"
                aria-checked={isActive()}
                aria-label={preset.name}
                title={preset.name}
                onClick={() => props.onSelect(preset.value)}
                class="relative w-8 h-8 flex items-center justify-center rounded-full border-2
                  transition-all duration-150 focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-primary"
                classList={{
                  "border-primary scale-110 shadow-md": isActive(),
                  "border-outline-variant hover:border-outline hover:scale-105": !isActive(),
                }}
                style={{ background: preset.value }}
              >
                <Show when={isActive()}>
                  <span
                    aria-hidden="true"
                    class="material-symbols-rounded rounded-filled text-white"
                    style={{ "font-size": "0.9rem", "text-shadow": "0 1px 2px rgba(0,0,0,0.4)" }}
                  >
                    check
                  </span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}