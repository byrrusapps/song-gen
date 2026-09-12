import type { Accessor, Setter } from "solid-js";
import type { UserData, UserStatus } from "../auth/User";
import type { MSG } from "../notifications/SnackBarMSG";
import type { AppRoutePath } from "../../config/app/AppRoutes";
import type { SetStoreFunction } from "solid-js/store";


export type BadgeState = Record<AppRoutePath, number>;
export type AppInfo = {
 drawer: Record<string, any>;
}


export interface AppCtx {
  // Device
  isMobile: Accessor<boolean>;
  os: Accessor<string>;
  mounted: Accessor<boolean>;

  // Navigation
  appPath: Accessor<AppRoutePath>;
  setAppPath: Setter<AppRoutePath>;
  pos: Accessor<number>;
  setPos: Setter<number>;

  // info
  info: AppInfo;
  setInfo: SetStoreFunction<AppInfo>;

  // Layout
  drawer: Accessor<boolean>;
  setDrawer: Setter<boolean>;
  drawerView: Accessor<any>;
  setDrawerView: Setter<any>;
  sideBar: Accessor<boolean>;
  setSideBar: Setter<boolean>;
  sideSheet: Accessor<boolean>;
  setSideSheet: Setter<boolean>;


  // Theme
  font: Accessor<string>;
  setFont: Setter<string>;

  // Snackbar / Toasts
  msgList: Accessor<MSG[]>;
  setMsgList: Setter<MSG[]>;
  newMsgs: (msgs: MSG[]) => void;

    // Badges
  badges: BadgeState;
  setBadges: SetStoreFunction<BadgeState>

  // Misc
  search: Accessor<string>;
  setSearch: Setter<string>;
}