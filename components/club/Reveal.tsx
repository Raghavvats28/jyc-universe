"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/timing";

/** Fade and rise into view once. Transform and opacity only. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises out of a mask when it scrolls into view. */
export function MaskLine({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className="overflow-hidden pb-[0.08em]">
      <motion.div
        className={className}
        initial={{ y: "108%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 1.05, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Small "floor" label: mark, name and a thin rule. */
export function FloorHead({ mark, name, note, accent }: { mark: string; name: string; note?: string; accent: string }) {
  return (
    <Reveal className="mb-10 flex items-center gap-4 md:mb-16">
      <span
        className="grid h-7 w-7 place-items-center border text-[11px] font-semibold tracking-wider"
        style={{ borderColor: `${accent}88`, color: accent }}
      >
        {mark}
      </span>
      <span className="text-sm text-bone/70">{name}</span>
      <span className="h-px flex-1 bg-line" />
      {note && <span className="text-sm text-ash">{note}</span>}
    </Reveal>
  );
}
