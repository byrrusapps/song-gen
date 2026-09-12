import { Dynamic } from "solid-js/web";
import { Show } from "solid-js";
import actions from "../../config/drawer/DrawerActions";
import { useApp } from "../../context/app/App";

const SideSheet = () => {
  const { drawer, setDrawer, drawerView } = useApp();

  const action = () => drawerView() ? actions?.[drawerView()!] : null;

  return (
    <Show when={drawer() && drawerView() && action()}>
      <div class="hidden relative w-[25rem] h-screen shrink-0 lg:flex flex-col box-border border-l border-outline-variant
        bg-inherit text-inherit overflow-y-scroll">

        {/* Header */}
        <div class="sticky top-0 z-10 flex items-center justify-between w-full px-4 h-14 shrink-0
          bg-inherit border-b border-outline-variant">
          <span class="text-on-surface font-medium text-title-small">
            {action()!.text}
          </span>
          <button
            onClick={() => setDrawer(false)}
            class="flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant
              hover:bg-on-surface/8 active:bg-on-surface/12 transition-colors"
            aria-label="Close panel"
          >
            <span class="material-symbols-rounded rounded-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div class="flex flex-col flex-1 w-full">
          <Show when={action()?.component}>
            <Dynamic component={action()!.component} />
          </Show>
        </div>

      </div>
    </Show>
  );
};

export default SideSheet;