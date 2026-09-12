import { createSignal, createEffect, onCleanup, type Accessor } from "solid-js";

type OS = "android" | "ios" | "other";

interface DeviceInfo {
  isMobile: Accessor<boolean>;
  os: Accessor<OS>;
}

interface UseDeviceInfoOptions {
  watch?: boolean;
}

/**
 * OS is one of: 'android' | 'ios' | 'other'
 * Recomputes on: resize, orientation changes, (pointer: coarse) changes,
 * and navigator.userAgentData 'change' (when supported).
 */
export function useDeviceInfo({ watch = true }: UseDeviceInfoOptions = {}): DeviceInfo {
  const [isMobile, setIsMobile] = createSignal(false);
  const [os, setOs] = createSignal<OS>("other");

  const nav = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
      addEventListener?: (event: string, handler: () => void) => void;
      removeEventListener?: (event: string, handler: () => void) => void;
    };
  };

  const compute = () => {
    const ua = nav.userAgent || "";
    const platform =
      (nav.userAgentData?.platform) ||
      nav.platform ||
      "";

    const isAndroid = /Android/i.test(ua) || /Android/i.test(platform);

    // iPadOS 13+ reports "MacIntel" but is touch-capable
    const isIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      /iOS|iPhone|iPad|iPod/i.test(platform) ||
      (platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const nextOs: OS = isAndroid ? "android" : isIOS ? "ios" : "other";

    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    const nextIsMobile =
      isAndroid ||
      isIOS ||
      coarse ||
      /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua);

    // Only update signals if values actually changed
    if (isMobile() !== nextIsMobile) setIsMobile(nextIsMobile);
    if (os() !== nextOs) setOs(nextOs);
  };

  createEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Throttle bursts of events using rAF
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    // Initial run
    compute();

    if (!watch) {
      onCleanup(() => cancelAnimationFrame(raf));
      return;
    }

    // Viewport/orientation listeners
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.screen?.orientation?.addEventListener?.("change", schedule);

    // Pointer coarse/fine changes (e.g., plugging mouse into a tablet)
    const mm = window.matchMedia?.("(pointer: coarse)");
    mm?.addEventListener?.("change", schedule);

    // UA-CH changes (e.g., Request Desktop Site or permission changes)
    nav.userAgentData?.addEventListener?.("change", schedule);

    // When tab becomes visible, recalc in case environment changed
    document.addEventListener("visibilitychange", schedule);

    onCleanup(() => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.screen?.orientation?.removeEventListener?.("change", schedule);
      mm?.removeEventListener?.("change", schedule);
      nav.userAgentData?.removeEventListener?.("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
      cancelAnimationFrame(raf);
    });
  });

  return { isMobile, os };
}

export default useDeviceInfo;