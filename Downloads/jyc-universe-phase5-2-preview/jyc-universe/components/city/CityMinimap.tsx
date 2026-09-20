"use client";

import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import type { CityLayout } from "@/lib/city";
import { P, pts } from "@/lib/iso";

/**
 * A ~120px map of the island: the ground diamond, one dot per building, and a rectangle
 * showing what the camera currently sees.
 *
 * It never touches the city. The rectangle is moved by writing one `transform` attribute
 * straight from the camera's motion values (no React state, no re-render while panning).
 * React only re-renders this component when the hovered club or the window size changes,
 * and it is a separate component from CityWorld, so the city is unaffected either way.
 */

interface Dot {
  id: string;
  x: number;
  y: number;
  accent: string;
}

const PAD = 220;

function CityMinimap({
  layout,
  dots,
  hovered,
  cam,
  scale,
  viewportRef,
}: {
  layout: CityLayout;
  dots: Dot[];
  hovered: string | null;
  cam: { x: MotionValue<number>; y: MotionValue<number> };
  scale: number;
  viewportRef: RefObject<HTMLElement>;
}) {
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const rectRef = useRef<SVGRectElement>(null);

  // The island diamond and the map's frame (island plus a margin).
  const geo = useMemo(() => {
    const s = layout.size;
    const c = [P(0, 0), P(s, 0), P(s, s), P(0, s)];
    const xs = c.map((p) => p[0]);
    const ys = c.map((p) => p[1]);
    const minX = Math.min(...xs) - PAD;
    const minY = Math.min(...ys) - PAD;
    return {
      diamond: pts(c),
      minX,
      minY,
      w: Math.max(...xs) + PAD - minX,
      h: Math.max(...ys) + PAD - minY,
    };
  }, [layout.size]);

  // Window size, so the rectangle has the right proportions.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const read = () => setSize((prev) => (prev[0] === el.clientWidth && prev[1] === el.clientHeight ? prev : [el.clientWidth, el.clientHeight]));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportRef]);

  // Follow the camera by writing the transform attribute directly.
  // `ready` matters: the <rect> only exists once the window size is known, so the effect must re-run then.
  const ready = scale > 0 && size[0] > 0;
  useEffect(() => {
    const rect = rectRef.current;
    if (!rect || !ready) return;
    const write = () => rect.setAttribute("transform", `translate(${-cam.x.get() / scale} ${-cam.y.get() / scale})`);
    write();
    const offX = cam.x.on("change", write);
    const offY = cam.y.on("change", write);
    return () => {
      offX();
      offY();
    };
  }, [cam, scale, ready]);

  if (!scale || !size[0]) return null;

  const k = geo.w / 120; // world units per map pixel
  return (
    <svg
      aria-hidden
      className="city-minimap"
      width={120}
      height={Math.round(geo.h / k)}
      viewBox={`${geo.minX} ${geo.minY} ${geo.w} ${geo.h}`}
    >
      <polygon className="mm-island" points={geo.diamond} />
      {dots.map((d) => (
        <circle key={d.id} className="mm-dot" data-on={hovered === d.id ? "true" : "false"} cx={d.x} cy={d.y} r={4.2 * k} style={{ fill: d.accent }} />
      ))}
      {/* Base position = the world's top-left; the transform moves it to where the camera looks. */}
      <rect ref={rectRef} className="mm-view" x={layout.world.minX} y={layout.world.minY} width={size[0] / scale} height={size[1] / scale} />
    </svg>
  );
}

export default memo(CityMinimap);
export type { Dot as MinimapDot };
