import { createEffect, onCleanup } from "solid-js";
import type { ThemeMode } from "./themeContext";

interface Params {
  dynamicTheme: () => ThemeMode;
  setDark: (d: boolean) => void;
}

const useHandleTheme = ({ dynamicTheme, setDark }: Params): void => {
  createEffect(() => {
    const mode = dynamicTheme();

    if (mode !== "automatic") {
      setDark(mode === "dark");
      return;
    }

    // Automatic — follow system, and watch for real-time changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    onCleanup(() => mq.removeEventListener("change", handler));
  });
};

export default useHandleTheme;