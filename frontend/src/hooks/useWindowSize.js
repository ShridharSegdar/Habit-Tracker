import { useEffect, useState } from "react";

/**
 * Returns the current window size (width/height) and re-renders on resize/orientation change.
 * Debounced via rAF for performance.
 */
export function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const handle = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener("resize", handle, { passive: true });
    window.addEventListener("orientationchange", handle, { passive: true });
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return size;
}
