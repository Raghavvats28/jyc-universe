"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject, type WheelEvent as ReactWheelEvent } from "react";
import { animate, useMotionValue } from "framer-motion";
import { EASE } from "@/lib/timing";

/**
 * A deliberately simple camera:
 *  - drag (mouse, touch, pen) pans the city, with a soft rubber band at the limits
 *  - a short glide after release
 *  - wheel / trackpad pans, arrow keys nudge
 *  - glide-to a world point or an element
 *
 * The camera is two motion values (x, y) = the screen offset of the world's top-left.
 * Nothing here causes a React re-render while moving; the world wrapper reads x and y
 * as a CSS transform. The only state is the fitted scale (changes on resize).
 *
 * A drag is separated from a click on purpose: pointer capture is NOT used (it would
 * retarget the click away from the building), and `didDrag()` lets clicks ignore drags.
 */

export interface CameraOptions {
  viewportRef: RefObject<HTMLElement>;
  world: { minX: number; minY: number; width: number; height: number };
  /** The framing that must fit on screen at the default camera. */
  frame: { width: number; height: number };
  /** Default world point to look at. */
  focus: [number, number];
  /** Optional override, read once on first measure (e.g. return from a club). */
  initialFocus?: () => [number, number] | null;
  reduced: boolean;
  onFirstDrag?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rubber = (v: number, lo: number, hi: number) => (v < lo ? lo - (lo - v) * 0.3 : v > hi ? hi + (v - hi) * 0.3 : v);

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function useCityCamera(opts: CameraOptions) {
  const { viewportRef, world, frame, focus } = opts;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [scale, setScale] = useState(0);

  const live = useRef({
    scale: 0,
    vw: 0,
    vh: 0,
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } as Bounds,
    ready: false,
    reduced: opts.reduced,
    onFirstDrag: opts.onFirstDrag,
    firstDragged: false,
  });
  live.current.reduced = opts.reduced;
  live.current.onFirstDrag = opts.onFirstDrag;

  const anims = useRef<Array<{ stop: () => void }>>([]);
  const drag = useRef({
    active: false,
    moved: false,
    touch: false,
    endedAt: 0,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
    samples: [] as Array<{ t: number; x: number; y: number }>,
  });

  const stopAnims = useCallback(() => {
    anims.current.forEach((a) => a.stop());
    anims.current = [];
  }, []);

  const glide = useCallback(
    (tx: number, ty: number, duration = 0.75) => {
      stopAnims();
      const { bounds, reduced } = live.current;
      const cx = clamp(tx, bounds.minX, bounds.maxX);
      const cy = clamp(ty, bounds.minY, bounds.maxY);
      if (reduced) {
        x.set(cx);
        y.set(cy);
        return;
      }
      anims.current = [animate(x, cx, { duration, ease: EASE }), animate(y, cy, { duration, ease: EASE })];
    },
    [x, y, stopAnims],
  );

  /* ---------- measure: fit scale, bounds, and keep the same world point centred ---------- */
  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    if (!vw || !vh) return;
    const st = live.current;
    if (st.ready && (vw !== st.vw || vh !== st.vh)) stopAnims();

    let cxWorld = focus[0];
    let cyWorld = focus[1];
    if (st.ready) {
      cxWorld = (st.vw / 2 - x.get()) / st.scale + world.minX;
      cyWorld = (st.vh / 2 - y.get()) / st.scale + world.minY;
    } else {
      const override = opts.initialFocus?.();
      if (override) [cxWorld, cyWorld] = override;
    }

    const s = clamp(Math.min(vw / frame.width, vh / frame.height), 0.6, 1.3);
    const cw = world.width * s;
    const ch = world.height * s;
    const bounds: Bounds = {
      minX: cw <= vw ? (vw - cw) / 2 : vw - cw,
      maxX: cw <= vw ? (vw - cw) / 2 : 0,
      minY: ch <= vh ? (vh - ch) / 2 : vh - ch,
      maxY: ch <= vh ? (vh - ch) / 2 : 0,
    };

    st.scale = s;
    st.vw = vw;
    st.vh = vh;
    st.bounds = bounds;
    st.ready = true;
    setScale(s);

    x.set(clamp(vw / 2 - (cxWorld - world.minX) * s, bounds.minX, bounds.maxX));
    y.set(clamp(vh / 2 - (cyWorld - world.minY) * s, bounds.minY, bounds.maxY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportRef, world.minX, world.minY, world.width, world.height, frame.width, frame.height, focus, x, y, stopAnims]);

  useEffect(() => {
    measure();
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, viewportRef]);

  /* ---------- public helpers ---------- */

  const panToWorld = useCallback(
    (wx: number, wy: number) => {
      const st = live.current;
      glide(st.vw / 2 - (wx - world.minX) * st.scale, st.vh / 2 - (wy - world.minY) * st.scale);
    },
    [glide, world.minX, world.minY],
  );

  const panBy = useCallback((dx: number, dy: number) => glide(x.get() + dx, y.get() + dy, 0.45), [glide, x, y]);

  /** Glide so an element sits inside the viewport. `force` centres it regardless. */
  const ensureVisible = useCallback(
    (el: Element, force = false) => {
      const host = viewportRef.current;
      if (!host) return;
      const vr = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const inside = r.left > vr.left + 60 && r.right < vr.right - 60 && r.top > vr.top + 90 && r.bottom < vr.bottom - 40;
      if (inside && !force) return;
      const dx = vr.left + vr.width / 2 - (r.left + r.width / 2);
      const dy = vr.top + vr.height / 2 - (r.top + r.height / 2);
      glide(x.get() + dx, y.get() + dy, 0.6);
    },
    [glide, viewportRef, x, y],
  );

  /**
   * True while dragging and for a moment after release, so the click that trails a drag is ignored.
   * The window is short on purpose: a later keyboard activation (Enter on a focused building) must still work.
   */
  const didDrag = useCallback(() => {
    const d = drag.current;
    return d.moved && (d.active || performance.now() - d.endedAt < 350);
  }, []);

  /* ---------- pointer drag ---------- */

  const onPointerDown = useMemo(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      // Fingers jitter more than mice: a tap must not turn into a drag.
      if (!d.moved && Math.hypot(dx, dy) > (d.touch ? 12 : 6)) {
        d.moved = true;
        stopAnims();
        viewportRef.current?.setAttribute("data-dragging", "true");
        const st = live.current;
        if (!st.firstDragged) {
          st.firstDragged = true;
          st.onFirstDrag?.();
        }
      }
      if (!d.moved) return;
      const b = live.current.bounds;
      x.set(rubber(d.ox + dx, b.minX, b.maxX));
      y.set(rubber(d.oy + dy, b.minY, b.maxY));
      d.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      if (d.samples.length > 8) d.samples.shift();
    };

    const up = () => {
      const d = drag.current;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      viewportRef.current?.removeAttribute("data-dragging");
      if (!d.active) return;
      d.active = false;
      d.endedAt = performance.now();
      if (!d.moved) return;

      // Release: a short glide in the direction of the flick, then settle inside the limits.
      const s = d.samples;
      let vx = 0;
      let vy = 0;
      if (s.length >= 2) {
        const last = s[s.length - 1];
        const first = s.find((p) => last.t - p.t <= 100) ?? s[0];
        const dt = Math.max(1, last.t - first.t);
        vx = (last.x - first.x) / dt;
        vy = (last.y - first.y) / dt;
      }
      glide(x.get() + vx * 180, y.get() + vy * 180, 0.8);
      // `moved` stays true until the next press; didDrag() only honours it for a short window after release.
    };

    return (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as Element).closest("[data-nodrag]")) return;
      stopAnims();
      const d = drag.current;
      d.active = true;
      d.moved = false;
      d.touch = e.pointerType !== "mouse";
      d.sx = e.clientX;
      d.sy = e.clientY;
      d.ox = x.get();
      d.oy = y.get();
      d.samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };
  }, [x, y, glide, stopAnims, viewportRef]);

  /* ---------- wheel and keys ---------- */

  const onWheel = useCallback(
    (e: ReactWheelEvent<HTMLElement>) => {
      const st = live.current;
      const unit = e.deltaMode === 1 ? 16 : 1;
      let dx = e.deltaX * unit;
      let dy = e.deltaY * unit;
      const roomY = st.bounds.maxY - st.bounds.minY;
      // A plain mouse wheel only reports deltaY: use it sideways when there is little vertical room.
      if ((e.shiftKey || roomY < 40) && dx === 0) {
        dx = dy;
        dy = 0;
      }
      stopAnims();
      x.set(clamp(x.get() - dx, st.bounds.minX, st.bounds.maxX));
      y.set(clamp(y.get() - dy, st.bounds.minY, st.bounds.maxY));
    },
    [x, y, stopAnims],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.getElementById("jyc-menu")) return; // menu overlay is open
      const step = 120;
      if (e.key === "ArrowLeft") panBy(step, 0);
      else if (e.key === "ArrowRight") panBy(-step, 0);
      else if (e.key === "ArrowUp") panBy(0, step);
      else if (e.key === "ArrowDown") panBy(0, -step);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panBy]);

  useEffect(() => stopAnims, [stopAnims]);

  return { x, y, scale, bind: { onPointerDown, onWheel }, panToWorld, ensureVisible, didDrag };
}
