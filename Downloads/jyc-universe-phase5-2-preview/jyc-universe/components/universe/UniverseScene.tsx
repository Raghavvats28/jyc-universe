"use client";

import { motion } from "framer-motion";
import Constellation from "./Constellation";
import MobileUniverse from "./MobileUniverse";

export default function UniverseScene() {
  return (
    <section className="relative min-h-dvh">
      <h1 className="sr-only">The JYC universe</h1>

      {/* Desktop and tablet: the interactive map */}
      <div className="relative hidden h-dvh md:block">
        <Constellation />

        <motion.div
          className="pointer-events-none absolute bottom-10 left-12 max-w-[17rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.2 }}
        >
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Choose a world.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone/60">
            Hover a constellation to see what lives there, click to travel.
          </p>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute bottom-10 right-12 flex items-center gap-3 text-sm text-bone/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.4 }}
        >
          <svg width="36" height="2" aria-hidden>
            <line x1="0" y1="1" x2="36" y2="1" stroke="#ece7dc" strokeOpacity="0.5" strokeDasharray="3 5" />
          </svg>
          Worlds that work together
        </motion.div>
      </div>

      {/* Phones: simplified list of worlds */}
      <MobileUniverse />
    </section>
  );
}
