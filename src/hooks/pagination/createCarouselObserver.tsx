import { createSignal, onMount, onCleanup } from "solid-js";

interface CarouselObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  axis?: "x" | "y";
}

export default function createCarouselObserver(options: CarouselObserverOptions = {}) {
  const { threshold = 0.6, rootMargin = "0px", } = options;

  let containerEl: HTMLElement | undefined;
  const itemsMap = new Map<number, HTMLElement>();
  let observer: IntersectionObserver | null = null;

  const [activeIndex, setActiveIndex] = createSignal(0);

  const initObserver = () => {
    if (!containerEl) return;

    observer?.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!best) return;

        for (const [idx, el] of itemsMap) {
          if (el === best.target) {
            setActiveIndex(idx);
            break;
          }
        }
      },
      {
        root: containerEl,
        rootMargin,
        threshold: Array.isArray(threshold) ? threshold : [threshold],
      }
    );

    itemsMap.forEach((el) => observer!.observe(el));
  };

  const containerRef = (el: HTMLElement) => {
    containerEl = el;
    onMount(initObserver);
  };

  const registerItem = (index: number) => (el: HTMLElement | null) => {
    const prev = itemsMap.get(index);
    if (prev) observer?.unobserve(prev);

    if (el) {
      itemsMap.set(index, el);
      observer?.observe(el);
    } else {
      itemsMap.delete(index);
    }
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const node = itemsMap.get(index);
    if (!node) return;
    node.scrollIntoView({ behavior, block: "nearest", inline: "start" });
  };

  onCleanup(() => {
    observer?.disconnect();
    observer = null;
  });

  return { containerRef, registerItem, activeIndex, scrollToIndex };
}