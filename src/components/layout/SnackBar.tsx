/**
 * Snackbar.tsx
 *
 * Material Design 3 — Snackbar
 * Spec: https://m3.material.io/components/snackbar
 *
 * Driven by AppContext: msgList, setMsgList
 * Drop <Snackbar /> once somewhere in your root layout.
 */

import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { useApp } from "../../context/app/App";
import type { MSG } from "../../types/notifications/SnackBarMSG";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SnackbarProps {
  /** Duration in ms before auto-dismiss. Default: 4000. Set to 0 to disable. */
  duration?: number;
  /**
   * Optional global action fallback. 
   * Local actions on the MSG object itself will override this.
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ─── Icon map (Material Symbols) ─────────────────────────────────────────────

const TYPE_ICON: Record<MSG["type"], string> = {
  info: "info",
  success: "check_circle",
  error: "error",
  warning: "warning",
};

// ─── Component ────────────────────────────────────────────────────────────────

const Snackbar = (props: SnackbarProps) => {
  const { msgList, setMsgList } = useApp();

  // Local state drives the CSS enter/exit classes.
  const [visible, setVisible] = createSignal(false);
  const [mounted, setMounted] = createSignal(false);

  let dismissTimer: ReturnType<typeof setTimeout> | undefined;
  let unmountTimer: ReturnType<typeof setTimeout> | undefined;
  
  // We keep track of the current message reference to prevent the timer 
  // from resetting if a new message gets pushed to the back of the queue
  let currentMsgRef: MSG | undefined;

  // Always derive UI from the very first item in the queue
  const activeMsg = () => msgList()[0];

  const dismiss = () => {
    setVisible(false);
    unmountTimer = setTimeout(() => {
      // Remove the first item. If there are more items, the effect will 
      // see the next one and automatically trigger the entrance animation.
      setMsgList((prev) => prev.slice(1));
      currentMsgRef = undefined;
    }, 220); // matches exit duration
  };

  createEffect(() => {
    const msg = activeMsg();

    // If there is a message and it's a NEW one we haven't animated yet
    if (msg && msg !== currentMsgRef) {
      currentMsgRef = msg;
      clearTimeout(dismissTimer);
      clearTimeout(unmountTimer);

      setMounted(true);
      
      // Double requestAnimationFrame ensures the DOM paints the hidden state 
      // before we apply the visible CSS class to trigger the transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });

      const dur = props.duration ?? 4000;
      if (dur > 0) {
        dismissTimer = setTimeout(dismiss, dur);
      }
    } else if (!msg) {
      // Queue is completely empty
      currentMsgRef = undefined;
      setVisible(false);
      setMounted(false);
    }
  });

  onCleanup(() => {
    clearTimeout(dismissTimer);
    clearTimeout(unmountTimer);
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Show when={mounted() && activeMsg()}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${activeMsg()?.type} notification`}
        class={[
          // Layout
          "fixed bottom-4 left-4 right-4",
          "md:left-6 md:right-auto md:min-w-[344px] md:max-w-[672px]",
          // In case a bottom nav bar is present — bump it up
          "mb-[env(safe-area-inset-bottom,0px)]",
          // M3 Surface: inverse-surface
          "bg-[var(--md-sys-color-inverse-surface)]",
          "text-[var(--md-sys-color-inverse-on-surface)]",
          // Shape: Extra Small (4dp)
          "rounded-[4px]",
          // Elevation Level 3 — shadow-based in M3
          "shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)]",
          // Motion
          "transition-all duration-[300ms]",
          visible()
            ? "opacity-100 translate-y-0 ease-[cubic-bezier(0.05,0.7,0.1,1)]"
            : "opacity-0 translate-y-4 ease-[cubic-bezier(0.3,0,0.8,0.15)]",
          // Z
          "z-[9999]",
        ].join(" ")}
        // Pause auto-dismiss while user hovers
        onMouseEnter={() => clearTimeout(dismissTimer)}
        onMouseLeave={() => {
          const dur = props.duration ?? 4000;
          if (dur > 0) dismissTimer = setTimeout(dismiss, dur);
        }}
      >
        <div class="flex items-center gap-3 px-4 py-3 min-h-12">

          {/* Type icon */}
          <span
            class="material-symbols-rounded text-xl! shrink-0 text-[var(--md-sys-color-inverse-on-surface)]"
            aria-hidden="true"
          >
            {TYPE_ICON[activeMsg()?.type ?? "info"]}
          </span>

          {/* Message — Body Medium */}
          <span class="grow text-sm leading-snug">
            {activeMsg()?.msg}
          </span>

          {/* Optional action button — prioritizes the specific message action over global props */}
          <Show when={activeMsg()?.action || props.action}>
            {(actionSignal) => {
              const action = actionSignal();
              return (
                <button
                  type="button"
                  onClick={() => {
                    action.onClick();
                    dismiss();
                  }}
                  class="ml-2 shrink-0 px-3 h-9 flex items-center
                         text-[var(--md-sys-color-inverse-primary)]
                         text-sm font-semibold tracking-wide uppercase rounded-sm
                         hover:bg-[var(--md-sys-color-inverse-primary)]/8
                         active:bg-[var(--md-sys-color-inverse-primary)]/12
                         focus-visible:outline-2
                         focus-visible:outline-[var(--md-sys-color-inverse-primary)]
                         transition-colors cursor-pointer"
                >
                  {action.label}
                </button>
              );
            }}
          </Show>

          {/* Dismiss button — always present for accessibility */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification"
            class="ml-1 shrink-0 w-9 h-9 flex items-center justify-center rounded-sm
                   text-[var(--md-sys-color-inverse-on-surface)]/70
                   hover:bg-[var(--md-sys-color-inverse-on-surface)]/8
                   active:bg-[var(--md-sys-color-inverse-on-surface)]/12
                   focus-visible:outline-2
                   focus-visible:outline-[var(--md-sys-color-inverse-on-surface)]
                   transition-colors cursor-pointer"
          >
            <span class="material-symbols-rounded text-lg!" aria-hidden="true">
              close
            </span>
          </button>
        </div>
      </div>
    </Show>
  );
};

export default Snackbar;