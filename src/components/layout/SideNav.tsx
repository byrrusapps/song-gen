import { For, Show, createMemo, onMount } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import AppRoutes from "../../config/app/AppRoutes";
import { useApp } from "../../context/app/App";
import Badge from "../global/Badge";
import SignOut from "../../lib/auth/SignOut";
import GoogleLogin from "../../lib/auth/GoogleLogin";

const isRouteActive = (pathname: string, routePath: string) =>
  routePath === "/"
    ? pathname === "/"
    : pathname === routePath || pathname.startsWith(`${routePath}/`);

const SideNav = () => {
  const { setAppPath, user, setMsgList, badges } = useApp();
  const location = useLocation();

  const hideWhenPathStartsWith = ["/admin"];
  const shouldShowNav = createMemo(
    () => !hideWhenPathStartsWith.some((p) => location.pathname.startsWith(p))
  );

  const signOut = () => SignOut({ setMsgList });

  onMount(() => {
    const route = AppRoutes.find((r) => isRouteActive(location.pathname, r.path));
    if (route) setAppPath(route.path);
  });

  return (
    <Show when={shouldShowNav()}>
      <aside
        class="hidden lg:flex w-[16rem] h-screen p-4 flex-col gap-4 items-center
        justify-between sticky top-0 z-50 box-border border-r border-outline-variant"
      >
        <span class="text-2xl font-[Sarina]">
          {import.meta.env.VITE_NAME}
        </span>

        <button
          type="button"
          class="w-full py-2 px-4 flex items-center justify-center gap-1
          text-on-background text-xs uppercase box-border border border-[currentcolor]
          transition-colors duration-150 hover:bg-surface-container hover:text-on-surface
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" class="material-symbols-rounded">
            add_box
          </span>
          <span class="text-[inherit] font-bold">Create Project</span>
        </button>

        <nav
          aria-label="Primary navigation"
          class="relative w-full h-fit grow flex flex-col gap-4 border-b border-outline-variant"
        >
          <span id="sidenav-menu-label" class="mt-4 text-sm text-on-surface-variant">
            Menu
          </span>
          <ul
            role="list"
            aria-labelledby="sidenav-menu-label"
            class="flex flex-col gap-4 list-none m-0 p-0"
          >
            <For each={AppRoutes}>
              {(r) => {
                const active = () => isRouteActive(location.pathname, r.path);
                const badgeCount = () => (r.badge.active ? badges[r.path] : 0);
                const showDot = () => r.badge.active && r.badge.dotOnly && badgeCount() > 0;

                return (
                  <li role="listitem" class="w-full" style={{ order: r.order[1] }}>
                    <A
                      href={r.path}
                      end
                      onClick={() => setAppPath(r.path)}
                      aria-label={r.text}
                      aria-current={active() ? "page" : undefined}
                      title={r.text}
                      class={`relative py-2 p-4 shrink-0 w-full flex gap-4 items-center
                      transition-all duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none
                      box-border cursor-pointer hover:bg-inverse-surface hover:text-inverse-on-surface
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                      rounded-[0.5rem]
                      ${
                        active()
                          ? "text-inverse-on-surface bg-inverse-surface"
                          : "text-on-surface-variant"
                      }`}
                    >
                      <Badge
                        content={badgeCount()}
                        dotOnly={showDot()}
                        position="top-right"
                        borderColor={active() ? "border-inverse-surface" : "border-background"}
                      >
                        <span
                          aria-hidden="true"
                          class={`material-symbols-rounded text-[1.25rem]! text-inherit
                          ${active() ? "rounded-filled leading-1" : ""}`}
                        >
                          {r.icon}
                        </span>
                      </Badge>

                      <span class="text-sm text-inherit capitalize">{r.text}</span>
                    </A>
                  </li>
                );
              }}
            </For>
          </ul>
        </nav>

        <Show when={!user()}>
          <md-filled-button class="py-2 px-4" on:click={() => GoogleLogin({ setMsgList })}>
            Login with Google
          </md-filled-button>
        </Show>

        <Show when={user()}>
          <div class="w-full flex items-center gap-2">
            <A
              href="/profile"
              aria-label={`View profile: ${user()?.myName ?? "your account"}`}
              class="flex-1 min-w-0 flex items-center gap-3 p-1 rounded-[0.5rem] cursor-pointer
              transition-transform duration-150 active:scale-95 motion-reduce:transition-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={user()?.myAvatar}
                alt=""
                class="w-[3rem] aspect-[1/1] rounded-[0.5rem] object-cover shrink-0"
                crossOrigin="anonymous"
              />
              <span class="text-sm text-on-surface truncate">{user()?.myName}</span>
            </A>

            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              class="shrink-0 w-10 h-10 flex items-center justify-center rounded-[0.5rem]
              text-on-surface-variant transition-all duration-150 ease-out active:scale-95
              motion-reduce:transition-none hover:bg-surface-container hover:text-on-surface
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden="true" class="material-symbols-rounded text-[1.25rem]">
                logout
              </span>
            </button>
          </div>
        </Show>
        
      </aside>
    </Show>
  );
};

export default SideNav;