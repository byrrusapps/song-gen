import { onCleanup, onMount } from "solid-js";

/**
 * Registers a window "pointerdown" listener that calls `onClose` whenever
 * the user clicks outside the element returned by `getRef`.
 * Automatically cleaned up on component unmount.
 */
function useOutsideClick(
  getRef: () => HTMLElement | undefined,
  onClose: () => void
) {
  const handler = (e: PointerEvent) => {
    const ref = getRef();
    if (ref && !ref.contains(e.target as Node)) onClose();
  };
  onMount(() => window.addEventListener("pointerdown", handler));
  onCleanup(() => window.removeEventListener("pointerdown", handler));
}

export { useOutsideClick };