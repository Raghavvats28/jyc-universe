import { memo, type CSSProperties } from "react";
import type { CitySpot } from "@/lib/city";
import { HALF_W, P } from "@/lib/iso";

/**
 * Hover callout for one building: a flat plate beside the building with the club name,
 * its one-line tagline and "Enter". Pure SVG + CSS.
 *
 * Callouts are drawn in a layer ABOVE all buildings (see CityWorld), so a taller
 * neighbour can never cover one. Visibility is one data attribute (`data-on`) flipped by
 * the same `hovered` state that lights the building; the fade and slide are CSS
 * (opacity + transform only, see city.css).
 */

const BOX_H = 64;
const GAP = 24;

/** Which side of the building the plate sits on: toward the open side of the island. */
export function calloutSide(spot: CitySpot): 1 | -1 {
  const [cx] = P(spot.gx + spot.w / 2, spot.gy + spot.d / 2, 0);
  return cx < 150 ? 1 : -1;
}

function Callout({
  spot,
  name,
  tagline,
  accent,
  on,
}: {
  spot: CitySpot;
  name: string;
  tagline: string;
  accent: string;
  on: boolean;
}) {
  const { gx, gy, w, d, height: h } = spot;
  const side = calloutSide(spot);

  // Anchor on the building's outermost vertical edge, about 60% of the way up.
  const edgeX = side === 1 ? (gx + w - gy) * HALF_W : (gx - gy - d) * HALF_W;
  const [, edgeY] = P(gx + w / 2, gy + d / 2, h * 0.6);

  const width = Math.round(Math.min(300, Math.max(150, name.length * 11.5, tagline.length * 6.9) + 38));
  const x0 = side === 1 ? 0 : -width; // plate's left edge, relative to the plate origin
  const tx = x0 + 18;

  return (
    <g
      className="b-callout"
      data-on={on ? "true" : "false"}
      style={{ "--b": accent, "--dx": `${-side * 10}px` } as CSSProperties}
      aria-hidden="true"
    >
      <path className="co-leader" d={`M${edgeX} ${edgeY}h${side * GAP}`} />
      <circle className="co-dot" cx={edgeX} cy={edgeY} r={3} />
      <g transform={`translate(${edgeX + side * GAP} ${edgeY})`}>
        <g className="co-plate">
          <rect className="co-bg" x={x0} y={-BOX_H / 2} width={width} height={BOX_H} />
          <rect className="co-bar" x={side === 1 ? x0 : x0 + width - 3} y={-BOX_H / 2} width={3} height={BOX_H} />
          <text className="co-name" x={tx} y={-10}>
            {name}
          </text>
          <text className="co-tag" x={tx} y={8}>
            {tagline}
          </text>
          <text className="co-enter" x={tx} y={25}>
            Enter →
          </text>
        </g>
      </g>
    </g>
  );
}

export default memo(Callout);
