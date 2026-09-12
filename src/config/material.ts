import type { MaterialPalette } from "../types/material/MaterialPalette";

export const paletteClasses: {[K in MaterialPalette]:{ idle: string; active: string; border: string }}  = {
  primary: {
    idle:   "bg-primary-container   text-on-primary-container",
    active: "bg-primary             text-on-primary",
    border: "border-primary",
  },
  secondary: {
    idle:   "bg-secondary-container text-on-secondary-container",
    active: "bg-secondary           text-on-secondary",
    border: "border-secondary",
  },
  tertiary: {
    idle:   "bg-tertiary-container  text-on-tertiary-container",
    active: "bg-tertiary            text-on-tertiary",
    border: "border-tertiary",
  },
};