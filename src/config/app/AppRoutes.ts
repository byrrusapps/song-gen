// src/config/app/AppRoutes.ts

export const RouteGroups = ["workspace", "platform", "system"] as const;
export type RouteGroup = (typeof RouteGroups)[number];

const AppRoutes = [
  {
    icon: "dashboard",
    text: "Dashboard",
    path: "/",
    group: "workspace",
    order: [1, 1], // [mobile, desktop]
    badge: { active: false, dotOnly: false },
  },
  {
    icon: "widgets",
    text: "Modules",
    path: "/modules",
    group: "platform",
    order: [2, 2],
    // dot lights up when modules are sitting in pending_review
    badge: { active: true, dotOnly: true },
  },
  {
    icon: "rocket_launch",
    text: "Builds",
    path: "/builds",
    group: "platform",
    order: [3, 3],
    // dot lights up on a running/failed pipeline run
    badge: { active: true, dotOnly: true },
  },
  {
    icon: "science",
    text: "Tests",
    path: "/tests",
    group: "platform",
    order: [4, 4],
    // SPA test harnesses per module (webhook trigger, auth flow, etc.)
    badge: { active: false, dotOnly: false },
  },
  {
    icon: "settings",
    text: "System",
    path: "/system",
    group: "system",
    order: [5, 5],
    badge: { active: false, dotOnly: false },
  },
] as const;

export type AppRoutePath = (typeof AppRoutes)[number]["path"];

export const routesByGroup = (group: RouteGroup) =>
  AppRoutes.filter((r) => r.group === group).sort((a, b) => a.order[1] - b.order[1]);

export default AppRoutes;