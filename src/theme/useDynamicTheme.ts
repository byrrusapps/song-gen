import { createEffect } from "solid-js";

export function useDynamicTheme(sourceColor: () => string, dark: () => boolean) {
  if (typeof window === "undefined") return;

  createEffect(() => {
    // ✅ Read signals synchronously — SolidJS tracks these as dependencies
    const color = sourceColor();
    const isDark = dark();

    // Async work happens after; signal values are already captured above
    import("./applyTheme").then(({ applyTheme }) => applyTheme(color, isDark));
  });
}