import { createEffect, type Accessor } from "solid-js";

interface UseUpdateSettingsProps {
  // In Solid, we pass the raw value if it's coming from a reactive source, 
  // or an Accessor if we want to ensure we track it correctly.
  // Usually, inside a component, props are already reactive.
  dynamicTheme: Accessor<string>;
}

const useUpdateSettings = (props: UseUpdateSettingsProps): void => {
  // Solid's createEffect automatically tracks any signal accessed inside it.
  createEffect(() => {
    const theme = props.dynamicTheme;
    localStorage.setItem("dynamicTheme", theme());
  });
};

export default useUpdateSettings;