import { type ParentProps } from "solid-js";

const AppBody = (props: ParentProps) => {
  return (
<div class="relative flex flex-col w-full lg:shrink-1 grow box-border text-inherit items-center h-screen 
overflow-y-scroll bg-background">
      {props.children}
    </div>
  );
};

export default AppBody;