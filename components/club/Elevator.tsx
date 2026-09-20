"use client";

import { useEffect, useState } from "react";
import { useMotionTier } from "@/hooks/useMotionTier";

export interface Floor {
  id: string;
  mark: string;
  name: string;
}

/**
 * The floor indicator on the right edge: G, 1, 2, 3, 4, R.
 * It is the club space's only navigation, so the page feels like a building, not a scroll.
 * Active floor comes from an IntersectionObserver (no scroll listener).
 */
/**
 * Scroll to a floor and move keyboard focus with it, so the next Tab starts on that floor
 * instead of wherever the button was. Floors are tabIndex -1 sections (focusable, not in the Tab order).
 */
export function goToFloor(id: string, smooth: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  el.focus({ preventScroll: true });
}

export default function Elevator({ floors, accent }: { floors: Floor[]; accent: string }) {
  const tier = useMotionTier();
  const [active, setActive] = useState(floors[0]?.id ?? "");

  useEffect(() => {
    const els = floors.map((f) => document.getElementById(f.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [floors]);

  const go = (id: string) => goToFloor(id, tier !== "static");

  return (
    <nav aria-label="Floors" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-7">
      <ul className="flex flex-col items-end gap-3">
        {floors.map((f) => {
          const on = f.id === active;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => go(f.id)}
                aria-current={on ? "location" : undefined}
                aria-label={`Floor ${f.mark}: ${f.name}`}
                className="group flex items-center gap-3"
              >
                <span
                  className={`text-xs tracking-wide transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0 group-hover:opacity-80 group-focus-visible:opacity-80"}`}
                  style={{ color: on ? accent : undefined }}
                >
                  {f.name}
                </span>
                <span
                  className="grid h-6 w-6 place-items-center border text-[10px] font-semibold transition-colors duration-300"
                  style={{
                    borderColor: on ? accent : "rgba(236,231,220,0.22)",
                    color: on ? "#0b0c0c" : "rgba(236,231,220,0.6)",
                    background: on ? accent : "transparent",
                  }}
                >
                  {f.mark}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
