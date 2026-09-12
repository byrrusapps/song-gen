import { For } from "solid-js";
import { useTheme, type ThemeMode } from "../../theme/themeContext";

interface Theme {
  id: ThemeMode;
  text: string;
  sub: string;
  icon: string;
  previewClass: string;
}

const THEMES: readonly Theme[] = [
  {
    id: "automatic",
    text: "System Default",
    sub: "Matches your device settings",
    icon: "brightness_auto",
    previewClass: "bg-gradient-to-br from-slate-200 to-slate-900"
  },
  {
    id: "dark",
    text: "Deep Obsidian",
    sub: "Easier on the eyes at night",
    icon: "dark_mode",
    previewClass: "bg-slate-900"
  },
  {
    id: "light",
    text: "Pure Alabaster",
    sub: "Crisp and high-contrast",
    icon: "light_mode",
    previewClass: "bg-slate-50 border border-outline-variant/20"
  },
] as const;

const ChangeTheme = () => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div class="flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-bold tracking-tight text-on-surface">Appearance</h2>
        <p class="text-xs text-on-surface-variant font-medium opacity-60 uppercase tracking-widest">Select your vibe</p>
      </div>

      <div class="flex flex-col gap-3">
        <For each={THEMES}>
          {(theme) => {
            const isActive = () => themeMode() === theme.id;

            return (
              <button
                onClick={() => setThemeMode(theme.id)}
                class={`
                  group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 border-2
                  ${isActive() 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : "bg-surface-container-low border-transparent hover:bg-surface-container-high"}
                `}
              >
                {/* Visual Preview Circle */}
                <div class={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${theme.previewClass}`}>
                   <span class={`material-symbols-rounded text-xl 
                     ${theme.id === 'dark' ? 'text-white' : 
                       theme.id === 'light' ? 'text-slate-900' : 'text-primary'}`}>
                     {theme.icon}
                   </span>
                </div>

                {/* Text Content */}
                <div class="flex flex-col text-left flex-1">
                  <span class={`text-sm font-bold transition-colors ${isActive() ? 'text-primary' : 'text-on-surface'}`}>
                    {theme.text}
                  </span>
                  <span class="text-[11px] text-on-surface-variant opacity-70">
                    {theme.sub}
                  </span>
                </div>

                {/* Selected Indicator */}
                <div class={`
                  w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive() ? "bg-primary scale-100 opacity-100" : "bg-outline-variant/20 scale-50 opacity-0"}
                `}>
                  <span class="material-symbols-rounded text-on-primary text-[16px]! font-bold">check</span>
                </div>
              </button>
            );
          }}
        </For>
      </div>

      {/* <div class="mt-4 p-4 rounded-2xl bg-surface-container-highest/30 border border-outline-variant/20">
        <p class="text-[10px] leading-relaxed text-center text-on-surface-variant opacity-60">
          Themes adjust automatically across all synced devices.
        </p>
      </div> */}
    </div>
  );
};

export default ChangeTheme;