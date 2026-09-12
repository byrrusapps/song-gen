import type { ComponentProps } from "solid-js";
import { splitProps } from "solid-js";

export interface MSIconProps extends ComponentProps<"span"> {
  children: string;
}

const MSIcon = (props: MSIconProps) => {
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <span {...rest} class={`material-symbols-outlined ${local.class ?? ""}`}>
      {local.children}
    </span>
  );
};

export default MSIcon;