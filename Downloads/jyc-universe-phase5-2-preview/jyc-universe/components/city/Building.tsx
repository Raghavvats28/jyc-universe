import { memo, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { CitySpot } from "@/lib/city";
import { P, pts } from "@/lib/iso";
import { Silhouettes } from "./buildings";

/** The building's on-screen outline. Shared by the hit area and the keyboard focus ring. */
export function hullOf(spot: CitySpot): string {
  const { gx, gy, w, d, height: h } = spot;
  return pts([P(gx, gy + d, 0), P(gx + w, gy + d, 0), P(gx + w, gy, 0), P(gx + w, gy, h), P(gx, gy, h), P(gx, gy + d, h)]);
}

export interface BuildingProps {
  spot: CitySpot;
  name: string;
  note: string;
  accent: string;
  /** 1-based position, shown as "01". */
  number: number;
  active: boolean;
  selected: boolean;
  onHover: (clubId: string | null) => void;
  onEnter: (clubId: string, el: SVGGElement) => void;
}

/**
 * One building in the city. Memoised: only the building whose `active` or `selected`
 * flag changes re-renders. All hover styling is CSS (see city.css).
 *
 * Structure (outer to inner):
 *   .bld            focusable link, carries data-active / data-selected
 *     .bld-enter    one-off rise animation when the city appears
 *       .bld-body   lifts a few px on hover
 *     .bld-hit      invisible hull so hovering never flickers while the body lifts
 */
function Building({ spot, name, note, accent, number, active, selected, onHover, onEnter }: BuildingProps) {
  const { gx, gy, w, d, height: h } = spot;
  const [fx, fy] = P(gx + w, gy + d, 0);

  const hull = hullOf(spot);

  // Corner brackets that mark the plot and extend when the building is active
  const len = 0.9;
  const brackets =
    `M${P(gx + len, gy).join(" ")}L${P(gx, gy).join(" ")}L${P(gx, gy + len).join(" ")}` +
    `M${P(gx + w - len, gy).join(" ")}L${P(gx + w, gy).join(" ")}L${P(gx + w, gy + len).join(" ")}` +
    `M${P(gx + w, gy + d - len).join(" ")}L${P(gx + w, gy + d).join(" ")}L${P(gx + w - len, gy + d).join(" ")}` +
    `M${P(gx, gy + d - len).join(" ")}L${P(gx, gy + d).join(" ")}L${P(gx + len, gy + d).join(" ")}`;

  const [gcx, gcy] = P(gx + w / 2, gy + d / 2, 0);

  const act = (el: SVGGElement) => onEnter(spot.clubId, el);

  return (
    <g
      className="bld"
      data-club={spot.clubId}
      data-active={active ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      aria-hidden="true"
      style={{ "--b": accent, "--i": number - 1 } as CSSProperties}
      onPointerEnter={() => onHover(spot.clubId)}
      onPointerLeave={() => onHover(null)}
      onClick={(e: MouseEvent<SVGGElement>) => act(e.currentTarget)}
    >
      <g className="bld-enter">
        {/* Footprint glow and brackets sit on the ground and do not lift */}
        <ellipse className="plot-glow" cx={gcx} cy={gcy} rx={w * 62} ry={w * 31} />
        <path className="plot-br" d={brackets} />

        <g className="bld-body">
          <Silhouettes spot={spot} />
        </g>

        <g className="b-tag" transform={`translate(${fx} ${fy})`}>
          <text className="b-index" y={26} textAnchor="middle">
            {String(number).padStart(2, "0")}
          </text>
          <text className="b-label" y={48} textAnchor="middle">
            {name.toUpperCase()}
          </text>
          <text className="b-cue" y={68} textAnchor="middle">
            Tap to enter
          </text>
        </g>
      </g>

      <polygon className="bld-hit" points={hull} />
      <rect className="bld-hit" x={fx - 70} y={fy + 8} width={140} height={68} />
    </g>
  );
}

export default memo(Building);

/**
 * Keyboard and screen-reader twin of a building. The painted buildings are in depth order (back to
 * front), which is the wrong Tab order; these sit after them in club-number order (01, 02, 03 ...)
 * and carry the link role, the label and a visible focus ring drawn on the building's outline.
 * They never take pointer events, so the mouse still hits the painted building.
 */
function BuildingFocusImpl({
  spot,
  name,
  note,
  accent,
  onHover,
  onFocusBuilding,
  onEnter,
}: {
  spot: CitySpot;
  name: string;
  note: string;
  accent: string;
  onHover: (clubId: string | null) => void;
  onFocusBuilding: (clubId: string, el: SVGGElement) => void;
  onEnter: (clubId: string, el: SVGGElement) => void;
}) {
  return (
    <polygon
      className="bld-proxy"
      data-proxy={spot.clubId}
      points={hullOf(spot)}
      role="link"
      tabIndex={0}
      aria-label={`${name}, ${note}. Enter the club space`}
      style={{ "--b": accent } as CSSProperties}
      onFocus={(e) => {
        onHover(spot.clubId);
        onFocusBuilding(spot.clubId, e.currentTarget as unknown as SVGGElement);
      }}
      onBlur={() => onHover(null)}
      onClick={(e) => onEnter(spot.clubId, e.currentTarget as unknown as SVGGElement)}
      onKeyDown={(e: KeyboardEvent<SVGPolygonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEnter(spot.clubId, e.currentTarget as unknown as SVGGElement);
        }
      }}
    />
  );
}

export const BuildingFocus = memo(BuildingFocusImpl);
