import type { JSX } from "solid-js";

interface GratisfolioLogoProps {
  /**
   * Size of the logo in pixels. Controls both width and height.
   * @default 64
   */
  size?: number;
  /** Additional CSS class names */
  class?: string;
  /** Inline styles */
  style?: JSX.CSSProperties;
  /** Accessible label for the SVG */
  label?: string;
}

export function GratisfolioLogo(props: GratisfolioLogoProps) {
  const size = () => props.size ?? 64;

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      width={size()}
      height={size()}
      class={props.class}
      style={props.style}
      role="img"
      aria-label={props.label ?? "Gratisfolio"}
    >
      {/* Back page — rotated slightly to imply a folio */}
      <rect
        x="15"
        y="6"
        width="34"
        height="44"
        rx="3.5"
        fill="var(--md-sys-color-secondary-container, #d8e4ff)"
        transform="rotate(4 32 28)"
      />

      {/* Front page body with corner fold cut at top-right */}
      <path
        d="M15 11 Q15 8 18 8 L38 8 L50 20 L50 55 Q50 58 47 58 L18 58 Q15 58 15 55 Z"
        fill="var(--md-sys-color-primary-container, #dce5ff)"
      />

      {/* Fold shadow triangle */}
      <path
        d="M38 8 L50 20 L38 20 Z"
        fill="var(--md-sys-color-primary, #415f91)"
        opacity="0.18"
      />

      {/* Fold crease line */}
      <path
        d="M38 8 L50 20"
        stroke="var(--md-sys-color-primary, #415f91)"
        stroke-width="1"
        opacity="0.35"
      />

      {/* Header bar — represents a resume name/title */}
      <rect
        x="21"
        y="27"
        width="22"
        height="3.5"
        rx="1.75"
        fill="var(--md-sys-color-primary, #415f91)"
      />

      {/* Body lines — decreasing width mimics resume content hierarchy */}
      <rect x="21" y="34.5" width="18" height="2.5" rx="1.25"
        fill="var(--md-sys-color-on-primary-container, #001945)"
        opacity="0.55"
      />
      <rect x="21" y="40" width="22" height="2.5" rx="1.25"
        fill="var(--md-sys-color-on-primary-container, #001945)"
        opacity="0.45"
      />
      <rect x="21" y="45.5" width="14" height="2.5" rx="1.25"
        fill="var(--md-sys-color-on-primary-container, #001945)"
        opacity="0.35"
      />

      {/* Sparkle on fold corner — nod to "gratis" (free, a gift) */}
      <g
        transform="translate(43.5, 13.5)"
        fill="var(--md-sys-color-primary, #415f91)"
        opacity="0.75"
      >
        <path d="M0-4.5 Q0.8-0.8 4.5 0 Q0.8 0.8 0 4.5 Q-0.8 0.8-4.5 0 Q-0.8-0.8 0-4.5Z" />
      </g>
    </svg>
  );
}