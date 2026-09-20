"use client";

import { memo, useMemo } from "react";
import { byDepth, type CityLayout, type CitySpot } from "@/lib/city";
import { identityFor } from "@/lib/identity";
import type { Club, Domain } from "@/lib/types";
import Building, { BuildingFocus } from "./Building";
import Callout from "./Callout";
import CityDefs from "./CityDefs";
import Ground from "./Ground";
import { CityBeam, CityDrone, CityScenery, plazaOf } from "./Scenery";

interface Props {
  layout: CityLayout;
  domain: Domain;
  clubs: Club[];
  /** Pixel scale of the SVG (world px to screen px). */
  scale: number;
  hovered: string | null;
  selected: string | null;
  onHover: (clubId: string | null) => void;
  onFocusBuilding: (clubId: string, el: SVGGElement) => void;
  onEnter: (clubId: string, el: SVGGElement) => void;
}

/**
 * The whole city as ONE svg. Painter's order: scenery, ground, buildings back to front, aerial.
 * The svg is sized in real pixels (world size x scale) so it is rasterised sharply, and the
 * camera only ever translates its wrapper.
 */
function CityWorld({ layout, domain, clubs, scale, hovered, selected, onHover, onFocusBuilding, onEnter }: Props) {
  const { minX, minY, width, height } = layout.world;
  const ordered = useMemo(() => {
    // Painter's order, back to front. The plaza beam is sorted in like a building.
    const [px, py] = plazaOf(layout);
    const beamDepth = px + py + 1;
    const list: Array<{ kind: "spot"; spot: CitySpot } | { kind: "beam" }> = [];
    let beamDone = false;
    for (const spot of byDepth(layout.spots)) {
      if (!beamDone && spot.gx + spot.w + spot.gy + spot.d > beamDepth) {
        list.push({ kind: "beam" });
        beamDone = true;
      }
      list.push({ kind: "spot", spot });
    }
    if (!beamDone) list.push({ kind: "beam" });
    return list;
  }, [layout]);
  const numbers = useMemo(() => new Map(clubs.map((c, i) => [c.id, i + 1])), [clubs]);
  // Club-number order (the order of `clubs`), for callouts and keyboard focus.
  const layers = useMemo(
    () =>
      clubs.flatMap((club) => {
        const spot = layout.spots.find((sp) => sp.clubId === club.id);
        return spot ? [{ spot, club, identity: identityFor(club, domain) }] : [];
      }),
    [clubs, layout.spots, domain],
  );

  return (
    <svg
      className="city-svg"
      width={Math.round(width * scale)}
      height={Math.round(height * scale)}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      data-selected={selected ? "true" : "false"}
      role="group"
      aria-label={`${domain.name} city`}
    >
      <CityDefs theme={layout.theme} />
      <CityScenery layout={layout} />
      <Ground layout={layout} />

      {ordered.map((item) => {
        if (item.kind === "beam") return <CityBeam key="beam" layout={layout} />;
        const spot = item.spot;
        const club = clubs.find((c) => c.id === spot.clubId);
        if (!club) return null;
        const identity = identityFor(club, domain);
        return (
          <Building
            key={spot.clubId}
            spot={spot}
            name={club.name}
            note={identity.cityNote}
            accent={identity.accent}
            number={numbers.get(club.id) ?? 0}
            active={hovered === spot.clubId}
            selected={selected === spot.clubId}
            onHover={onHover}
            onEnter={onEnter}
          />
        );
      })}

      {/* Callouts: one layer above every building, so no neighbour can cover them */}
      <g className="callouts" pointerEvents="none">
        {layers.map(({ spot, club, identity }) => (
          <Callout key={spot.clubId} spot={spot} name={club.name} tagline={club.tagline} accent={identity.accent} on={hovered === spot.clubId} />
        ))}
      </g>

      <CityDrone layout={layout} />

      {/* Keyboard twins, in club-number order */}
      <g className="focus-layer">
        {layers.map(({ spot, club, identity }) => (
          <BuildingFocus
            key={spot.clubId}
            spot={spot}
            name={club.name}
            note={identity.cityNote}
            accent={identity.accent}
            onHover={onHover}
            onFocusBuilding={onFocusBuilding}
            onEnter={onEnter}
          />
        ))}
      </g>
    </svg>
  );
}

export default memo(CityWorld);
