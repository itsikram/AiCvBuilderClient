import { useCallback, useEffect, useState } from "react";

/**
 * The rendered width of an element, kept up to date as the layout changes. Returns a callback
 * ref, so it also measures elements that appear later (e.g. once data has loaded).
 */
export function useElementWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: T | null) => setElement(node), []);
  useEffect(() => {
    if (!element) return;
    // ResizeObserver also reports the first size, so this sets the width as soon as it mounts
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [ref, width] as const;
}
