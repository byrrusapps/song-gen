import { type RouteSectionProps } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import useCloseDrawerOnNavigate from "../../hooks/navigation/useCloseDrawerOnNavigate";
const AppBody = clientOnly(() => import("./AppBody"));
const SideNav = clientOnly(() => import("./SideNav"));
const SideSheet = clientOnly(() => import("./SideSheet"));
const BottomDrawer = clientOnly(() => import("./BottomDrawer"));
const Snackbar = clientOnly(() => import("./SnackBar"));




export default function Layout(props: RouteSectionProps) {

  if(typeof window !== undefined){
    useCloseDrawerOnNavigate();
  }

  return (
    <div class="absolute w-screen top-0 left-0 h-auto min-h-screen flex flex-row bg-background text-on-background font-sans">
      <SideNav />
      <AppBody>
        {props.children}
      </AppBody>
      <SideSheet />
      <BottomDrawer />
      <Snackbar />
    </div>
  );
}