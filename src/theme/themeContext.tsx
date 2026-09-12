import { createContext, useContext, createSignal, createEffect, onMount } from "solid-js";
import { useDynamicTheme } from "./useDynamicTheme";
import useHandleTheme from "./useHandleTheme";

export type ThemeMode = "automatic" | "dark" | "light";

interface ThemeCtx {
  sourceColor: () => string;
  dark: () => boolean;
  themeMode: () => ThemeMode;
  setSourceColor: (c: string) => void;
  setThemeMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx>(null!);

const STORAGE_KEY_MODE  = "gf:themeMode";
const STORAGE_KEY_COLOR = "gf:sourceColor";

export function ThemeProvider(props: { children: any }) {
  const [sourceColor, setSourceColor] = createSignal("#212361");
  const [dark, setDark]               = createSignal(true);
  const [themeMode, setThemeMode]     = createSignal<ThemeMode>("dark");

  // ── Hydrate from localStorage (client only) ─────────────────────────────
  onMount(() => {
    const savedMode  = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null;
    // const savedColor = localStorage.getItem(STORAGE_KEY_COLOR);
    if (savedMode)  setThemeMode(savedMode);
    // if (savedColor) setSourceColor(savedColor);
  });

  // ── Persist whenever changed ─────────────────────────────────────────────
  createEffect(() => localStorage.setItem(STORAGE_KEY_MODE,  themeMode()));
  createEffect(() => localStorage.setItem(STORAGE_KEY_COLOR, sourceColor()));

  // ── Apply theme CSS vars (reacts to sourceColor + dark) ──────────────────
  useDynamicTheme(sourceColor, dark);

  // ── Resolve themeMode → dark bool (handles matchMedia for "automatic") ───
  useHandleTheme({ dynamicTheme: themeMode, setDark });

  return (
    <ThemeContext.Provider value={{ sourceColor, dark, themeMode, setSourceColor, setThemeMode }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be called within a ThemeProvider");
  return ctx;
};

export default ThemeProvider;