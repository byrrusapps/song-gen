const COLOR_ROLES = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "onError", "errorContainer", "onErrorContainer",
  "background", "onBackground",
  "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
  "outline", "outlineVariant", "shadow", "scrim",
  "inverseSurface", "inverseOnSurface", "inversePrimary",
  "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
  "surfaceContainerHigh", "surfaceContainerHighest",
] as const;

// The standard Material Design 3 tonal stops
const TONES = [
  0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100
] as const;

type ColorRole = typeof COLOR_ROLES[number];

function roleToVar(role: string) {
  return "--md-sys-color-" + role.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function paletteToVar(paletteName: string, tone: number) {
  return `--md-ref-palette-${paletteName.replace(/([A-Z])/g, "-$1").toLowerCase()}-${tone}`;
}

export async function applyTheme(
  sourceHex: string,
  dark = false,
  target: HTMLElement = document.documentElement
) {
  if (typeof window === "undefined") return;

  const {
    argbFromHex,
    hexFromArgb,
    MaterialDynamicColors,
    Hct,
    SchemeExpressive: AppScheme 
  } = await import("@material/material-color-utilities");

  const hct = Hct.fromInt(argbFromHex(sourceHex));
  const scheme = new AppScheme(hct, dark, 0);

  // 1. Apply semantic color roles
  for (const role of COLOR_ROLES) {
    // Cast as any because MaterialDynamicColors index signature isn't strictly exported in some versions
    const dynColor = (MaterialDynamicColors as any)[role];
    if (!dynColor) continue;
    
    // Note: getArgb(scheme) gets the contextual color (light/dark mode aware)
    target.style.setProperty(roleToVar(role), hexFromArgb(dynColor.getArgb(scheme)));
  }

  // 2. Extract and apply reference tonal palettes
  const palettes = {
    primary: scheme.primaryPalette,
    secondary: scheme.secondaryPalette,
    tertiary: scheme.tertiaryPalette,
    error: scheme.errorPalette,
    neutral: scheme.neutralPalette,
    neutralVariant: scheme.neutralVariantPalette,
  };

  for (const [name, palette] of Object.entries(palettes)) {
    for (const tone of TONES) {
      // palette.tone() returns the raw ARGB integer for that tonal step
      target.style.setProperty(paletteToVar(name, tone), hexFromArgb(palette.tone(tone)));
    }
  }

  // 3. Apply global meta-variables
  target.style.setProperty("--md-source-color", sourceHex);
  target.setAttribute("data-theme", dark ? "dark" : "light");
}