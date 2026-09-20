"use client";

import "./club.css";
import { useCallback, useEffect, useMemo, type CSSProperties, type MouseEvent } from "react";
import { MotionConfig } from "framer-motion";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMotionTier } from "@/hooks/useMotionTier";
import { useToday } from "@/hooks/useToday";
import { RETURN_KEY } from "@/lib/city";
import { splitEvents } from "@/lib/dates";
import type { ClubIdentity } from "@/lib/identity";
import type { Club, Domain, JycEvent } from "@/lib/types";
import Elevator, { goToFloor, type Floor } from "./Elevator";
import ConnectFloor, { type ClubNav } from "./floors/ConnectFloor";
import EventsFloor from "./floors/EventsFloor";
import GalleryFloor from "./floors/GalleryFloor";
import Lobby from "./floors/Lobby";
import MilestonesFloor from "./floors/MilestonesFloor";
import TeamFloor from "./floors/TeamFloor";

const FLOORS: Floor[] = [
  { id: "floor-about", mark: "G", name: "About" },
  { id: "floor-team", mark: "1", name: "Team" },
  { id: "floor-achievements", mark: "2", name: "Achievements" },
  { id: "floor-events", mark: "3", name: "Events" },
  { id: "floor-gallery", mark: "4", name: "Gallery" },
  { id: "floor-connect", mark: "R", name: "Connect" },
];

/**
 * A club's space, laid out as the floors of its building (see Elevator).
 * The club's identity (accent, motif, title treatment) is passed in and flows down;
 * no floor decides its own colours.
 */
export default function ClubScene({
  club,
  domain,
  identity,
  events,
  todayISO,
  prev,
  next,
  hasCity,
}: {
  club: Club;
  domain: Domain;
  identity: ClubIdentity;
  events: JycEvent[];
  todayISO: string;
  prev?: Club;
  next?: Club;
  /** True when this club's world has a city to go back to. */
  hasCity: boolean;
}) {
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const today = useToday(todayISO);
  const { upcoming, past } = useMemo(() => splitEvents(events, today), [events, today]);

  // Remember where we came from so the city can look at this building on return.
  useEffect(() => {
    try {
      sessionStorage.setItem(RETURN_KEY, club.id);
    } catch {
      /* private mode: harmless */
    }
  }, [club.id]);

  const nav = useMemo<ClubNav>(
    () => ({
      toCity: (e) =>
        travelTo(hasCity ? `/domain/${domain.id}` : "/universe", {
          origin: originOf(e),
          accent: domain.accent,
          label: hasCity ? domain.name : "Universe",
        }),
      toUniverse: (e) => travelTo("/universe", { origin: originOf(e), label: "Universe" }),
      toClub: (c, e) => travelTo(`/club/${c.id}`, { origin: originOf(e), accent: identity.accent, label: c.name }),
    }),
    [travelTo, domain.id, domain.accent, domain.name, hasCity, identity.accent],
  );

  const toTeam = useCallback(() => {
    goToFloor("floor-team", tier !== "static");
  }, [tier]);

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ "--accent": identity.accent } as CSSProperties}>
        <Elevator floors={FLOORS} accent={identity.accent} />
        <Lobby club={club} domain={domain} identity={identity} onBack={(e: MouseEvent<HTMLButtonElement>) => nav.toCity(e)} onDown={toTeam} />
        <TeamFloor club={club} identity={identity} />
        <MilestonesFloor club={club} identity={identity} />
        <EventsFloor club={club} identity={identity} upcoming={upcoming} past={past} />
        <GalleryFloor club={club} identity={identity} />
        <ConnectFloor club={club} domain={domain} identity={identity} prev={prev} next={next} nav={nav} />
      </div>
    </MotionConfig>
  );
}
