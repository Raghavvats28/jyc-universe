import type { ReactNode } from "react";
import { P, ellipseR, pts, windowGrid, type WindowSpec } from "@/lib/iso";

/**
 * Small SVG building blocks for the city. Pure and static: no state, no effects.
 * All colours come from the gradients in <CityDefs /> and the classes in city.css.
 */

export interface PrismProps {
  gx: number;
  gy: number;
  w: number;
  d: number;
  z0?: number;
  h: number;
  fill?: { top?: string; left?: string; right?: string };
  className?: string;
}

/** A box: top, left wall, right wall, with thin edges. */
export function Prism({ gx, gy, w, d, z0 = 0, h, fill, className = "edge" }: PrismProps) {
  const zt = z0 + h;
  const top = [P(gx, gy, zt), P(gx + w, gy, zt), P(gx + w, gy + d, zt), P(gx, gy + d, zt)];
  const left = [P(gx, gy + d, zt), P(gx + w, gy + d, zt), P(gx + w, gy + d, z0), P(gx, gy + d, z0)];
  const right = [P(gx + w, gy, zt), P(gx + w, gy + d, zt), P(gx + w, gy + d, z0), P(gx + w, gy, z0)];
  return (
    <g className={className}>
      <polygon points={pts(left)} fill={fill?.left ?? "url(#jc-left)"} />
      <polygon points={pts(right)} fill={fill?.right ?? "url(#jc-right)"} />
      <polygon points={pts(top)} fill={fill?.top ?? "url(#jc-top)"} />
    </g>
  );
}

export interface LayerPaths {
  warm?: string;
  cool?: string;
  /** Drawn in the building's own accent colour (var(--b)). */
  accent?: string;
  off?: string;
  hover?: string;
}

/** Window paths drawn in a face's local coordinates. */
export function WindowLayers({ matrix, paths }: { matrix: string; paths: LayerPaths }) {
  return (
    <g transform={matrix || undefined}>
      {paths.off && <path className="win-off" d={paths.off} />}
      {paths.warm && <path className="win-warm" d={paths.warm} />}
      {paths.cool && <path className="win-cool" d={paths.cool} />}
      {paths.accent && <path className="win-accent" d={paths.accent} />}
      {paths.hover && <path className="win-hover" d={paths.hover} />}
    </g>
  );
}

/** A window grid on a face. */
export function Windows({ matrix, spec }: { matrix: string; spec: WindowSpec }) {
  return <WindowLayers matrix={matrix} paths={windowGrid(spec)} />;
}

/** Text lying on a wall (local y points up, so the glyphs are flipped back). */
export function FaceText({
  matrix,
  x,
  y,
  size,
  children,
  className = "sign-text",
  spacing = 0,
}: {
  matrix: string;
  x: number;
  y: number;
  size: number;
  children: ReactNode;
  className?: string;
  spacing?: number;
}) {
  return (
    <g transform={matrix}>
      <text
        className={className}
        transform="scale(1 -1)"
        x={x}
        y={-y}
        fontSize={size}
        letterSpacing={spacing}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {children}
      </text>
    </g>
  );
}

/** Blinking rooftop light. Animated with opacity only, and only when motion is allowed. */
export function Beacon({ x, y, delay = 0, tone = "accent" }: { x: number; y: number; delay?: number; tone?: "accent" | "warn" }) {
  return (
    <g className={`beacon beacon-${tone}`} style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy={y} r={7} className="beacon-halo" />
      <circle cx={x} cy={y} r={2.3} className="beacon-core" />
    </g>
  );
}

/** A thin vertical light strip running up a wall's front edge. */
export function EdgeLight({ matrix, x, h, tone = "accent" }: { matrix: string; x: number; h: number; tone?: "accent" | "warm" }) {
  return (
    <g transform={matrix}>
      <rect className={tone === "accent" ? "edge-light" : "edge-light edge-light-warm"} x={x - 1.2} y={0} width={2.4} height={h} />
    </g>
  );
}

/** Front-half silhouette of a cylinder (a rect with a curved bottom) as a path. Shared by several buildings and the plaza. */
export function cylBody(cx: number, cy: number, r: number, z0: number, h: number): string {
  const [X, Y0] = P(cx, cy, z0);
  const { rx, ry } = ellipseR(r);
  const Yt = Math.round((Y0 - h) * 100) / 100;
  return `M${X - rx} ${Yt}L${X - rx} ${Y0}A${rx} ${ry} 0 0 0 ${X + rx} ${Y0}L${X + rx} ${Yt}Z`;
}
