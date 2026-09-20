"use client";

import { useEffect, useState } from "react";

/**
 * Returns null until mounted (so server and first client render agree),
 * then true/false and live-updates. Used to decide whether a phone or a desktop
 * experience is loaded, so phones never download the city code at all.
 */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}
