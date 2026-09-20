"use client";

import { motion } from "framer-motion";
import LogoMark from "@/components/LogoMark";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useSite } from "@/components/SiteProvider";
import MiniConstellation from "./MiniConstellation";

/**
 * Phones get a simplified universe: no map, no parallax, no hover states.
 * Universe -> world -> city -> club, one clear tap at a time.
 */
export default function MobileUniverse() {
  const { domains } = useSite();
  const { travelTo } = useTravel();

  return (
    <div className="px-5 pb-16 pt-24 md:hidden">
      <div className="mb-10 flex items-center gap-4">
        <LogoMark size="56px" />
        <p className="text-sm leading-snug text-bone/70">
          Jaypee Youth Club
          <br />
          Pick a world to enter.
        </p>
      </div>

      <ul className="border-t border-line">
        {domains.map((d, i) => (
          <motion.li
            key={d.id}
            className="border-b border-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-5 py-6 text-left"
              onClick={(e) =>
                travelTo(`/domain/${d.id}`, { origin: originOf(e), accent: d.accent, label: d.name })
              }
            >
              <MiniConstellation domain={d} />
              <span className="flex flex-col gap-1">
                <span className="font-display text-4xl font-semibold leading-none tracking-tight">
                  {d.name.charAt(0)}
                  {d.name.slice(1).toLowerCase()}
                </span>
                <span className="text-sm" style={{ color: d.accent }}>
                  {d.tagline}
                </span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
