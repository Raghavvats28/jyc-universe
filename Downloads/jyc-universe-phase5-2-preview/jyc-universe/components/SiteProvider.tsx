"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Domain, SiteIndex } from "@/lib/types";

/**
 * The small slice of content the persistent chrome needs on the client (HUD label, menu, universe map, intro).
 * app/layout.tsx builds it on the server from lib/data.ts and passes it as a plain serializable prop.
 */
const Ctx = createContext<SiteIndex | null>(null);

export default function SiteProvider({ value, children }: { value: SiteIndex; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const site = useContext(Ctx);
  if (!site) throw new Error("useSite must be used inside <SiteProvider> (app/layout.tsx).");
  return useMemo(
    () => ({
      domains: site.domains,
      collaborations: site.collaborations,
      getDomain: (id: string): Domain | undefined => site.domains.find((d) => d.id === id),
      getClub: (id: string) => site.clubs.find((c) => c.id === id),
      getEvent: (id: string) => site.events.find((e) => e.id === id),
    }),
    [site],
  );
}
