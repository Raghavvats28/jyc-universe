"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import LogoMark from "@/components/LogoMark";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMotionTier } from "@/hooks/useMotionTier";
import { useSite } from "@/components/SiteProvider";
import { EASE, INTRO } from "@/lib/timing";

const SEEN_KEY = "jyc:intro-seen";

/**
 * Opening sequence (no eagle yet):
 *   dark  ->  stars fade in (StarField)  ->  logo surfaces  ->  wordmark
 *   ->  orbits draw around the logo  ->  six world seeds light up  ->  Enter JYC
 *
 * The seeds sit at the exact map positions used by the universe scene,
 * so entering feels like the same space coming into focus.
 * Returning visitors (same session) get a 4x faster version.
 */
export default function LogoIntro() {
  const { domains, collaborations } = useSite();
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable: play the full intro */
    }
    setSpeed(seen ? 4 : 1);
  }, []);

  if (speed === null) return <div className="h-dvh" aria-hidden />;

  // Scale every duration/delay. Reduced motion: everything is instant.
  const t = (s: number) => (tier === "static" ? 0 : s / speed);

  const enter = () => {
    const logo = document.getElementById("intro-logo")?.getBoundingClientRect();
    travelTo("/universe", {
      origin: logo ? { x: logo.left + logo.width / 2, y: logo.top + logo.height / 2 } : undefined,
      label: "Universe",
    });
  };

  const rings = [
    { rx: 170, ry: 116, opacity: 0.18 },
    { rx: 400, ry: 270, opacity: 0.12 },
    { rx: 560, ry: 376, opacity: 0.07 },
  ];

  return (
    <section className="relative h-dvh w-full overflow-hidden">
      <h1 className="sr-only">Jaypee Youth Club</h1>

      {/* Slow push-in: transform only. */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: tier === "static" ? 1 : 1.06 }}
        transition={{ duration: t(9), ease: EASE }}
      >
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/*
            The constellations, drawn before the rings so they sit furthest back.
            Each world's own star cluster and its links come from the same data the
            universe map uses, so the opening is literally the map forming out of the dark
            rather than a decorative starburst. The whole group drifts (CSS, transform only).
          */}
          <g className="intro-drift">
            {domains.map((d, di) => (
              <g key={`c-${d.id}`}>
                {d.links.map(([a, b], li) => {
                  const p1 = d.stars[a];
                  const p2 = d.stars[b];
                  if (!p1 || !p2) return null;
                  return (
                    <motion.line
                      key={`l-${li}`}
                      x1={d.position.x + p1[0]}
                      y1={d.position.y + p1[1]}
                      x2={d.position.x + p2[0]}
                      y2={d.position.y + p2[1]}
                      stroke={d.accent}
                      strokeWidth={0.8}
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.45 }}
                      transition={{ duration: t(1.6), delay: t(INTRO.seedsIn + di * 0.18 + 0.35 + li * 0.08), ease: EASE }}
                    />
                  );
                })}
                {d.stars.map((st, si) => (
                  <motion.circle
                    key={`s-${si}`}
                    cx={d.position.x + st[0]}
                    cy={d.position.y + st[1]}
                    r={1.6}
                    fill="#ece7dc"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ duration: t(1.2), delay: t(INTRO.seedsIn + di * 0.18 + si * 0.06), ease: "easeOut" }}
                  />
                ))}
                {d.dust.map((du, ui) => (
                  <motion.circle
                    key={`u-${ui}`}
                    cx={d.position.x + du[0]}
                    cy={d.position.y + du[1]}
                    r={du[2] * 0.8}
                    fill="#ece7dc"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.22 }}
                    transition={{ duration: t(2), delay: t(INTRO.seedsIn + 0.5 + ui * 0.05), ease: "easeOut" }}
                  />
                ))}
              </g>
            ))}

            {/* The faint threads between worlds that collaborate: the universe is one piece. */}
            {collaborations.map(([a, b], i) => {
              const from = domains.find((d) => d.id === a);
              const to = domains.find((d) => d.id === b);
              if (!from || !to) return null;
              return (
                <motion.line
                  key={`co-${i}`}
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                  stroke="#ece7dc"
                  strokeWidth={0.7}
                  strokeDasharray="3 8"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.13 }}
                  transition={{ duration: t(2.4), delay: t(INTRO.seedsIn + 1.1), ease: "easeOut" }}
                />
              );
            })}
          </g>

          {rings.map((r, i) => (
            <motion.ellipse
              key={r.rx}
              cx={600}
              cy={400}
              rx={r.rx}
              ry={r.ry}
              fill="none"
              stroke="#ece7dc"
              strokeOpacity={r.opacity}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: t(2.2), delay: t(INTRO.ringsIn + i * 0.35), ease: EASE }}
            />
          ))}

          {domains.map((d, i) => (
            <motion.g key={`seed-${d.id}`}>
              <motion.circle
                cx={d.position.x}
                cy={d.position.y}
                r={13}
                fill={d.accent}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.16 }}
                transition={{ duration: t(1.6), delay: t(INTRO.seedsIn + i * 0.18), ease: EASE }}
              />
            <motion.circle
              key={d.id}
              cx={d.position.x}
              cy={d.position.y}
              r={4}
              fill={d.accent}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.95 }}
              transition={{ duration: t(0.9), delay: t(INTRO.seedsIn + i * 0.18), ease: EASE }}
            />
            </motion.g>
          ))}
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          {/* Soft light behind the logo */}
          <motion.div
            aria-hidden
            className="absolute h-[70vmin] w-[70vmin] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(236,231,220,0.10), rgba(236,231,220,0) 70%)",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: t(3), delay: t(INTRO.logoIn), ease: EASE }}
          />

          <div className="relative">
            <motion.div
              id="intro-logo"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: t(2.6), delay: t(INTRO.logoIn), ease: EASE }}
            >
              <LogoMark />
            </motion.div>

            <div className="absolute left-1/2 top-full mt-8 -translate-x-1/2 whitespace-nowrap">
              <motion.p
                className="text-[11px] font-medium uppercase tracking-[0.42em] text-bone/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: t(1.8), delay: t(INTRO.wordmarkIn), ease: "easeOut" }}
              >
                Jaypee Youth Club
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-[9vh] flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: t(1.2), delay: t(INTRO.enter), ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={enter}
          className="group relative px-2 py-3 font-display text-xl font-medium tracking-wide text-bone"
        >
          Enter JYC
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-1 h-px origin-left bg-bone/40 transition-transform duration-500 group-hover:scale-x-100 md:scale-x-50"
          />
        </button>
        <p className="text-sm text-ash">Six worlds, one universe.</p>

        {/*
          Admin is a real, separate sign-in (Supabase Auth, checked against the `admins` table and
          Postgres row-level security) — there is no shortcut password here, and there never should
          be: a fixed password baked into the page would be readable by anyone who opened dev tools.
          See app/admin/login and lib/admin/session.ts. This is just the door to it.
        */}
        <Link
          href="/admin/login"
          prefetch={false}
          className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ash/60 underline-offset-4 hover:text-ash hover:underline"
        >
          Administrator sign in
        </Link>
      </motion.div>
    </section>
  );
}
