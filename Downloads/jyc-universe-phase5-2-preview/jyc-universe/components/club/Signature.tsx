"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionTier } from "@/hooks/useMotionTier";
import type { MotifKind } from "@/lib/identity";
import Motif from "./Motif";

/**
 * The club space's hero artwork with its one signature interaction, by motif:
 *
 *   pips   two layers of dice pips drift against the pointer        (DICE)
 *   mesh   network nodes brighten and swell near the pointer         (DSC)
 *   rings  a radar sweep turns slowly                                (CICE)
 *   gears  gears turn slowly, neighbours in opposite directions      (Robotics)
 *   code   handled by <TypedText> in the lobby                       (Coding)
 *   waves  the wave layers drift sideways, one period per cycle      (Band, Vocals, DJ)
 *
 * Everything is transform or opacity. Loops and pointer effects run on the `full` motion tier
 * only (desktop, fine pointer, no reduced-motion); on other tiers the artwork is static.
 * The pointer effects are written straight to the DOM in one rAF, with no React state.
 */
export default function SignatureLayer({
  kind,
  accent,
  seed,
  className = "",
  style,
}: {
  kind: MotifKind;
  accent: string;
  seed: number;
  className?: string;
  style?: CSSProperties;
}) {
  const tier = useMotionTier();
  const ref = useRef<HTMLDivElement>(null);
  const live = tier === "full";

  useEffect(() => {
    if (!live || (kind !== "pips" && kind !== "mesh")) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const host = ref.current;
    const area = host?.closest("section");
    if (!host || !area) return;

    const nodes = kind === "mesh" ? Array.from(host.querySelectorAll<SVGElement>(".sig-node")) : [];
    const levels = nodes.map(() => 0);
    let raf = 0;
    let px = 0;
    let py = 0;
    let inside = false;

    const frame = () => {
      raf = 0;
      if (kind === "pips") {
        const r = area.getBoundingClientRect();
        const mx = inside ? ((px - r.left) / r.width - 0.5) * 2 : 0;
        const my = inside ? ((py - r.top) / r.height - 0.5) * 2 : 0;
        host.style.setProperty("--mx", mx.toFixed(3));
        host.style.setProperty("--my", my.toFixed(3));
        return;
      }
      // mesh: read every node position first, then write, so the browser lays out once
      const centres = nodes.map((n) => {
        const b = n.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      });
      nodes.forEach((n, i) => {
        const c = centres[i];
        const k = inside ? Math.max(0, 1 - Math.hypot(c.x - px, c.y - py) / 240) : 0;
        const q = Math.round(k * 20) / 20;
        if (q !== levels[i]) {
          levels[i] = q;
          n.style.setProperty("--k", String(q));
        }
      });
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      inside = true;
      queue();
    };
    const leave = () => {
      inside = false;
      queue();
    };

    area.addEventListener("pointermove", move, { passive: true });
    area.addEventListener("pointerleave", leave);
    return () => {
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [kind, live]);

  return (
    <div ref={ref} aria-hidden className={`sig ${className}`} data-tier={tier} data-kind={kind} style={style}>
      <Motif kind={kind} accent={accent} seed={seed} />
    </div>
  );
}

/**
 * Types a line once, with a block cursor that blinks and then goes away. Used for the Coding club's
 * tagline. Screen readers get the full text at once; reduced motion shows it typed already.
 * Text is written into a span directly, so nothing re-renders while it types.
 */
export function TypedText({ text, enabled, startDelay = 1500 }: { text: string; enabled: boolean; startDelay?: number }) {
  const tier = useMotionTier();
  const still = tier === "static";
  const spanRef = useRef<HTMLSpanElement>(null);
  const [caret, setCaret] = useState(enabled);

  useEffect(() => {
    if (!enabled || still) {
      setCaret(false);
      return;
    }
    const el = spanRef.current;
    if (!el) return;
    setCaret(true);
    el.textContent = "";
    let i = 0;
    let iv = 0;
    let hide = 0;
    const start = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i >= text.length) {
          window.clearInterval(iv);
          hide = window.setTimeout(() => setCaret(false), 1800);
        }
      }, 44);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(iv);
      window.clearTimeout(hide);
      el.textContent = text;
    };
  }, [enabled, still, text, startDelay]);

  if (!enabled) return <>{text}</>;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden ref={spanRef}>
        {text}
      </span>
      {caret && <span aria-hidden className="club-cursor ml-[0.15em] inline-block h-[0.95em] w-[0.5em] translate-y-[0.14em] bg-current" />}
    </>
  );
}
