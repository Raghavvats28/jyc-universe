"use client";

import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { EASE } from "@/lib/timing";
import type { ClubIdentity } from "@/lib/identity";
import type { Club, Domain } from "@/lib/types";
import { Reveal } from "../Reveal";
import SignatureLayer, { TypedText } from "../Signature";

/**
 * Ground floor: the club's name at poster scale, then About in large type.
 * The name is set by the club's identity: case, tracking, solid or outlined, optional cursor.
 */
export default function Lobby({
  club,
  domain,
  identity,
  onBack,
  onDown,
}: {
  club: Club;
  domain: Domain;
  identity: ClubIdentity;
  onBack: (e: MouseEvent<HTMLButtonElement>) => void;
  onDown: () => void;
}) {
  const a = identity.accent;
  const name = identity.titleCase === "lower" ? club.name.toLowerCase() : club.name.toUpperCase();
  const size = `clamp(4.5rem, min(${(138 / club.name.length).toFixed(1)}vw, 44vh), 30rem)`;

  // First sentence leads in full brightness, the rest recedes.
  const sentences = club.description.match(/[^.!?]+[.!?]+/g) ?? [club.description];
  const lead = sentences[0]?.trim() ?? "";
  const rest = sentences.slice(1).join(" ").trim();

  return (
    <section id="floor-about" aria-label="About" tabIndex={-1} className="outline-none relative flex min-h-dvh flex-col overflow-hidden px-5 pb-12 pt-24 md:px-12 md:pb-16 md:pt-28">
      <SignatureLayer
        kind={identity.motif}
        accent={a}
        seed={identity.heroSeed ?? 3}
        className="absolute inset-0 opacity-70"
        style={{ maskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)" }}
      />

      <motion.div
        className="relative z-10 flex items-center gap-3 text-sm text-bone/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <button type="button" onClick={onBack} className="flex items-center gap-2 transition-colors hover:text-bone">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {domain.name.charAt(0)}
          {domain.name.slice(1).toLowerCase()} city
        </button>
        <span aria-hidden>/</span>
        <span>Club space</span>
      </motion.div>

      <div className="relative z-10 mt-auto pt-16">
        <motion.p
          className="mb-4 text-base md:text-lg"
          style={{ color: a }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.9 }}
        >
          <TypedText text={club.tagline} enabled={Boolean(identity.cursor)} />
        </motion.p>

        <div className="overflow-hidden pb-[0.05em]">
          <motion.h1
            className="whitespace-nowrap font-display font-semibold"
            style={{
              fontSize: size,
              lineHeight: 0.84,
              letterSpacing: identity.tracking,
              color: identity.titleStyle === "solid" ? a : "transparent",
              WebkitTextStroke: identity.titleStyle === "outline" ? `2px ${a}` : undefined,
            }}
            initial={{ y: "108%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
          >
            {name}
            {identity.cursor && (
              <span
                aria-hidden
                className="club-cursor ml-[0.06em] inline-block align-baseline"
                style={{ width: "0.42em", height: "0.09em", background: a }}
              />
            )}
          </motion.h1>
        </div>
      </div>

      <div className="relative z-10 mt-14 grid gap-5 md:mt-20 md:grid-cols-[12rem_1fr] md:gap-12">
        <Reveal delay={0.1}>
          <p className="text-sm text-ash">About</p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="max-w-[26ch] font-display text-[clamp(1.7rem,3.6vw,3.6rem)] font-medium leading-[1.08] tracking-tight md:max-w-[30ch]">
            {lead}
            {rest && <span className="text-bone/50"> {rest}</span>}
          </p>
        </Reveal>
      </div>

      <button
        type="button"
        onClick={onDown}
        className="relative z-10 mt-12 flex w-fit items-center gap-2 text-sm text-bone/60 transition-colors hover:text-bone md:ml-auto"
      >
        Take the elevator up <ArrowDown className="h-3.5 w-3.5" aria-hidden />
      </button>
    </section>
  );
}
