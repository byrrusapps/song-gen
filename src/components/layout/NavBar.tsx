import { For } from "solid-js"
import MSIcon from "../global/MSIcon"
import { useApp } from "../../context/app/App";
import { AppRoutes } from "../../config/app/AppRoutes";

const NavBar = () => {

const { appPath } = useApp();

return(
<nav
class="fixed w-full p-3 bottom-0 left-auto flex flex-row items-center justify-between 
box-border bg-surface-container lg:hidden z-1000"
>

<For
each={AppRoutes}
>
{(r) => {

const { icon, text } = r;
const pathIsActive = r.path === appPath();

return(
<div
class={`relative flex flex-col items-center justify-center gap-1
${pathIsActive? "text-on-primary-container" : "text-on-surface-variant"}`}
>

<MSIcon
class={`${pathIsActive? "px-4 py-1 rounded-4xl bg-primary-container material-symbols-sharp" : ""}`}
>
{icon}
</MSIcon>

<span
class="capitalize text-xs text-on-surface"
>
{text}
</span>
</div>
)
}}
</For>

</nav>
)

}

export default NavBar;