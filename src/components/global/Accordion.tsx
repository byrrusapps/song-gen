import { Show, type Accessor, type JSX, type Setter } from "solid-js";

export const Accordion = (props: {
  id: string;
  icon: string;
  label: string;
  open: Accessor<string>;
  setOpen: Setter<string>;
  children: JSX.Element;
}) => {
  const isOpen = () => props.open() === props.id;
  const panelId = `panel-${props.id}`;
  const headerId = `header-${props.id}`;

  return (
    <div class="flex flex-col rounded-xl border border-outline-variant overflow-hidden">
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={isOpen()}
          aria-controls={panelId}
          class={`
            w-full flex items-center justify-between p-4 text-left cursor-pointer
            hover:bg-surface-container transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]
            focus-visible:outline-primary
            ${isOpen() ? "bg-surface-container-low" : "bg-transparent"}
          `}
          onClick={() => props.setOpen(props.id)}
        >
          <div class="flex items-center gap-3">
            <span
              aria-hidden="true"
              class="material-symbols-outlined p-2 text-on-primary-container bg-primary-container rounded-xl text-[1.25rem] leading-none"
            >
              {props.icon}
            </span>
            <span class="text-title-medium font-semibold text-on-surface">{props.label}</span>
          </div>
          <span
            aria-hidden="true"
            class={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${isOpen() ? "rotate-180" : "rotate-0"}`}
          >
            expand_more
          </span>
        </button>
      </h3>

      <Show when={isOpen()}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          class="flex flex-col gap-5 px-5 pt-4 pb-5 border-t border-outline-variant bg-surface-container-lowest/40"
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
};