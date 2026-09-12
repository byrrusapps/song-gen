import { createContext, useContext, createSignal,  type JSX } from 'solid-js';
import { type AppRoutePath } from '../../config/app/AppRoutes';
import AppRoutes from '../../config/app/AppRoutes';
import type { UserData } from '../../types/auth/User';
import { isServer } from 'solid-js/web';
import { type AppInfo, type AppCtx, type BadgeState } from '../../types/app/AppContext';
import type { MSG } from '../../types/notifications/SnackBarMSG';
import useDeviceInfo from '../../hooks/device/useDeviceInfo';
import { createStore } from 'solid-js/store';


const AppContext = createContext<AppCtx>(null!);

export function AppProvider(props: { children: JSX.Element }) {

  // Client state
  const [mounted] = createSignal(false);

  // Navigation
  const [appPath, setAppPath] = createSignal<AppRoutePath>(AppRoutes[0].path);
  const [pos, setPos] = createSignal(0);

  // info
  const [info, setInfo] = createStore<AppInfo>({
    drawer: { }
  });

  // Layout
  const [drawer, setDrawer] = createSignal(false);
  const [drawerView, setDrawerView] = createSignal<any>("save-profile");
  const [sideBar, setSideBar] = createSignal(false);
  const [sideSheet, setSideSheet] = createSignal(false);

  // Auth
  const [user, setUser] = createSignal<UserData | null>(null);
  const [isDeleting, setIsDeleting] = createSignal(false);

  // Theme
  const [font, setFont] = createSignal("'Onest', sans-serif");

  // Snackbar
  const [msgList, setMsgList] = createSignal<MSG[]>([]);

  const initialBadges = Object.fromEntries(AppRoutes.map((r) => [r.path as AppRoutePath, 0]));

const [badges, setBadges] = createStore<BadgeState>(initialBadges as BadgeState);

  const [search, setSearch] = createSignal('');


  const { isMobile, os } = isServer? { isMobile: () => true, os: () => ("ios")} : useDeviceInfo();

  const newMsgs = (msgs: MSG[]) => {

              setMsgList((prev) => [
      ...(prev || []),
      ...msgs,
    ]);
  }



  return (
    <AppContext.Provider value={{
      isMobile, os, mounted,
      appPath, setAppPath, pos, setPos,
      drawer, setDrawer, drawerView, setDrawerView,
      sideBar, setSideBar, sideSheet, setSideSheet,
      newMsgs, msgList, setMsgList,
      font, setFont, search, setSearch,
      badges, setBadges,
      info, setInfo,
    }}>
      {props.children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext)!;

export default AppProvider;