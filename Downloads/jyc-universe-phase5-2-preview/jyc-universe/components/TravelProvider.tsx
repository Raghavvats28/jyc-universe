"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, motion, useMotionValue, type MotionValue } from "framer-motion";
import { useMotionTier } from "@/hooks/useMotionTier";
import { EASE } from "@/lib/timing";

/**
 * The "camera". Every cross-scene navigation goes through travelTo():
 *
 *  1. The current scene pushes in toward the clicked point (transform only).
 *  2. Background stars streak away from that point (canvas, driven by warpRef).
 *  3. A circle grows from the point and covers the screen (transform only),
 *     showing the destination's name.
 *  4. The route changes underneath the cover.
 *  5. The new scene settles in while the cover fades out.
 *
 * Reduced-motion users get a plain router.push.
 */

export type TravelOrigin = { x: number; y: number };
export type TravelOptions = { origin?: TravelOrigin; accent?: string; label?: string };

type SceneValues = {
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  originX: MotionValue<number>;
  originY: MotionValue<number>;
};

type TravelContextValue = {
  travelTo: (href: string, options?: TravelOptions) => void;
  /** 0 = idle, 1 = full warp. Read every frame by the star field. */
  warpRef: MutableRefObject<number>;
  /** Point (client px) that stars streak away from. */
  originRef: MutableRefObject<TravelOrigin>;
  scene: SceneValues;
};

const TravelContext = createContext<TravelContextValue | null>(null);

export function useTravel(): TravelContextValue {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error("useTravel must be used inside <TravelProvider>");
  return ctx;
}

/** Best-effort travel origin from a click, falling back to the element centre for keyboard activation. */
export function originOf(e: {
  clientX: number;
  clientY: number;
  currentTarget: Element;
}): TravelOrigin {
  if (e.clientX === 0 && e.clientY === 0) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: e.clientX, y: e.clientY };
}

const COVER_MS = 950;
const REVEAL_MS = 900;
const SAFETY_MS = 3000;

type Phase = "idle" | "covering" | "revealing";
type Job = { origin: TravelOrigin; accent: string; label?: string; diameter: number };

export default function TravelProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const tier = useMotionTier();

  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);

  const warpRef = useRef(0);
  const originRef = useRef<TravelOrigin>({ x: 0, y: 0 });
  const pending = useRef<string | null>(null);
  const busy = useRef(false);

  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);
  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.5);

  const reveal = useCallback(() => {
    setPhase("revealing");
    originX.set(0.5);
    originY.set(0.5);
    scale.set(1.08);
    opacity.set(0);
    animate(scale, 1, { duration: 1, ease: EASE });
    animate(opacity, 1, { duration: 0.8, delay: 0.12, ease: "easeOut" });
    animate(warpRef.current, 0, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => {
        warpRef.current = v;
      },
    });
    window.setTimeout(() => {
      setPhase("idle");
      setJob(null);
      busy.current = false;
    }, REVEAL_MS);
  }, [scale, opacity, originX, originY]);

  // The new route has mounted: uncover it.
  useEffect(() => {
    if (pending.current !== null && pathname === pending.current) {
      pending.current = null;
      window.setTimeout(reveal, 90);
    }
  }, [pathname, reveal]);

  const travelTo = useCallback(
    (href: string, options: TravelOptions = {}) => {
      if (busy.current || href === window.location.pathname) return;

      if (tier === "static") {
        router.push(href);
        return;
      }

      busy.current = true;
      router.prefetch(href);

      const w = window.innerWidth;
      const h = window.innerHeight;
      const origin = options.origin ?? { x: w / 2, y: h / 2 };
      originRef.current = origin;

      // Smallest circle that still covers the whole viewport from this origin.
      const diameter =
        Math.ceil(Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y)) * 2) + 40;

      setJob({ origin, accent: options.accent ?? "#ece7dc", label: options.label, diameter });
      setPhase("covering");

      originX.set(origin.x / w);
      originY.set(origin.y / h);
      animate(scale, 1.6, { duration: COVER_MS / 1000, ease: [0.7, 0, 0.84, 0] });
      animate(opacity, 0, { duration: 0.4, delay: COVER_MS / 1000 - 0.45 });
      animate(0, 1, {
        duration: 0.9,
        ease: "easeIn",
        onUpdate: (v) => {
          warpRef.current = v;
        },
      });

      pending.current = href;
      window.setTimeout(() => router.push(href), COVER_MS);
      window.setTimeout(() => {
        if (pending.current !== null) {
          pending.current = null;
          reveal();
        }
      }, COVER_MS + SAFETY_MS);
    },
    [tier, router, scale, opacity, originX, originY, reveal],
  );

  const value = useMemo<TravelContextValue>(
    () => ({ travelTo, warpRef, originRef, scene: { scale, opacity, originX, originY } }),
    [travelTo, scale, opacity, originX, originY],
  );

  return (
    <TravelContext.Provider value={value}>
      {children}

      {job && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[60] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "revealing" ? 0 : 1 }}
          transition={{ duration: phase === "revealing" ? 0.8 : 0.01, ease: "easeOut" }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              left: job.origin.x - job.diameter / 2,
              top: job.origin.y - job.diameter / 2,
              width: job.diameter,
              height: job.diameter,
              background: `radial-gradient(circle, ${job.accent}3a 0%, #0b0c0c 58%)`,
              boxShadow: `inset 0 0 160px ${job.accent}44`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: COVER_MS / 1000, ease: [0.7, 0, 0.84, 0] }}
          />
          {job.label && (
            <div className="absolute inset-0 grid place-items-center">
              <motion.span
                className="font-display text-[clamp(2.5rem,9vw,8rem)] font-semibold tracking-tight"
                style={{ color: job.accent }}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
              >
                {job.label}
              </motion.span>
            </div>
          )}
        </motion.div>
      )}
    </TravelContext.Provider>
  );
}
