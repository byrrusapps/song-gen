import type { JSX } from "solid-js";

type El<T> = Omit<Partial<T>, "style" | "children"> & {
  style?: JSX.CSSProperties;
  children?: JSX.Element;
  class?: string;
} & JSX.DOMAttributes<T>;

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button":            El<import("@material/web/button/filled-button.js").MdFilledButton>;
      "md-outlined-button":          El<import("@material/web/button/outlined-button.js").MdOutlinedButton>;
      "md-text-button":              El<import("@material/web/button/text-button.js").MdTextButton>;
      "md-elevated-button":          El<import("@material/web/button/elevated-button.js").MdElevatedButton>;
      "md-filled-tonal-button":      El<import("@material/web/button/filled-tonal-button.js").MdFilledTonalButton>;
      "md-icon-button":              El<import("@material/web/iconbutton/icon-button.js").MdIconButton>;
      "md-filled-icon-button":       El<import("@material/web/iconbutton/filled-icon-button.js").MdFilledIconButton>;
      "md-filled-tonal-icon-button": El<import("@material/web/iconbutton/filled-tonal-icon-button.js").MdFilledTonalIconButton>;
      "md-outlined-icon-button":     El<import("@material/web/iconbutton/outlined-icon-button.js").MdOutlinedIconButton>;
      "md-fab":                      El<import("@material/web/fab/fab.js").MdFab>;
      "md-branded-fab":              El<import("@material/web/fab/branded-fab.js").MdBrandedFab>;
      "md-checkbox":                 El<import("@material/web/checkbox/checkbox.js").MdCheckbox>;
      "md-radio":                    El<import("@material/web/radio/radio.js").MdRadio>;
      "md-switch":                   El<import("@material/web/switch/switch.js").MdSwitch>;
      "md-assist-chip":              El<import("@material/web/chips/assist-chip.js").MdAssistChip>;
      "md-filter-chip":              El<import("@material/web/chips/filter-chip.js").MdFilterChip>;
      "md-input-chip":               El<import("@material/web/chips/input-chip.js").MdInputChip>;
      "md-suggestion-chip":          El<import("@material/web/chips/suggestion-chip.js").MdSuggestionChip>;
      "md-chip-set":                 El<import("@material/web/chips/chip-set.js").MdChipSet>;
      "md-filled-text-field":        El<import("@material/web/textfield/filled-text-field.js").MdFilledTextField>;
      "md-outlined-text-field":      El<import("@material/web/textfield/outlined-text-field.js").MdOutlinedTextField>;
      "md-filled-select":            El<import("@material/web/select/filled-select.js").MdFilledSelect>;
      "md-outlined-select":          El<import("@material/web/select/outlined-select.js").MdOutlinedSelect>;
      "md-select-option":            El<import("@material/web/select/select-option.js").MdSelectOption>;
      "md-slider":                   El<import("@material/web/slider/slider.js").MdSlider>;
      "md-dialog":                   El<import("@material/web/dialog/dialog.js").MdDialog>;
      "md-menu":                     El<import("@material/web/menu/menu.js").MdMenu>;
      "md-menu-item":                El<import("@material/web/menu/menu-item.js").MdMenuItem>;
      "md-sub-menu":                 El<import("@material/web/menu/sub-menu.js").MdSubMenu>;
      "md-tabs":                     El<import("@material/web/tabs/tabs.js").MdTabs>;
      "md-primary-tab":              El<import("@material/web/tabs/primary-tab.js").MdPrimaryTab>;
      "md-secondary-tab":            El<import("@material/web/tabs/secondary-tab.js").MdSecondaryTab>;
      "md-list":                     El<import("@material/web/list/list.js").MdList>;
      "md-list-item":                El<import("@material/web/list/list-item.js").MdListItem>;
      "md-circular-progress":        El<import("@material/web/progress/circular-progress.js").MdCircularProgress>;
      "md-linear-progress":          El<import("@material/web/progress/linear-progress.js").MdLinearProgress>;
      "md-ripple":                   El<import("@material/web/ripple/ripple.js").MdRipple>;
      // "md-focus-ring":               El<import("@material/web/focus/focus-ring.js").MdFocusRing>;
      "md-elevation":                El<import("@material/web/elevation/elevation.js").MdElevation>;
      "md-icon":                     El<import("@material/web/icon/icon.js").MdIcon>;
    }
  }
}

export {};