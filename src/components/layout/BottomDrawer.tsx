import { Dynamic } from "solid-js/web";
import { Show, createEffect } from "solid-js";
import actions from "../../config/drawer/DrawerActions";
import { useApp } from "../../context/app/App";

const BottomDrawer = () => {
  const { drawer, setDrawer, drawerView } = useApp();

  const action = () => drawerView() ? actions?.[drawerView()!] : null;

  // Lock body scroll while open
  createEffect(() => {
    document.body.style.overflow = drawer() ? "hidden" : "";
  });

  return (
    <Show when={drawer() && drawerView() && action()}>
      {/* Scrim */}
      <div
        class="lg:hidden fixed inset-0 z-4000 bg-scrim/40 backdrop-blur-sm"
        onClick={() => setDrawer(false)}
      />

      {/* Sheet */}
      <div
        class="lg:hidden fixed bottom-0 left-0 right-0 flex flex-col
          max-h-[85dvh] rounded-t-[28px] bg-surface-container text-on-surface
          border-t border-outline-variant overflow-hidden
          animate-[slideUp_240ms_cubic-bezier(0.2,0,0,1)_forwards] z-4000"
      >
        {/* Drag handle */}
        <div class="flex justify-center pt-3 pb-1 shrink-0">
          <div class="w-8 h-1 rounded-full bg-on-surface-variant/40" />
        </div>

        {/* Header */}
        <div class="flex items-center justify-between px-6 py-3 shrink-0">
          <span class="text-on-surface font-semibold text-base">
            {action()!.text}
          </span>
          <button
            onClick={() => setDrawer(false)}
            class="flex items-center justify-center w-10 h-10 rounded-full
              text-on-surface-variant hover:bg-on-surface/8 active:bg-on-surface/12 transition-colors"
            aria-label="Close drawer"
          >
            <span class="material-symbols-rounded rounded-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div class="flex-1 overflow-y-auto px-2 pb-[env(safe-area-inset-bottom)]">
          <Show when={action()?.component}>
            <Dynamic component={action()!.component} />
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default BottomDrawer;