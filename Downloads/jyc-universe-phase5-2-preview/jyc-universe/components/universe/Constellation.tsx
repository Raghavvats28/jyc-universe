"use client";

import { useCallback, useState, type CSSProperties, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import LogoMark from "@/components/LogoMark";
import { useSite } from "@/components/SiteProvider";
import { useTravel } from "@/components/TravelProvider";
import { useMotionTier } from "@/hooks/useMotionTier";
import { EASE } from "@/lib/timing";
import type { Domain } from "@/lib/types";

const CX = 600;
const CY = 400;

/** Slightly bent line between two domains, pulled toward the hub. */
function collabPath(a: Domain, b: Domain): string {
  const mx = (a.position.x + b.position.x) / 2;
  const my = (a.position.y + b.position.y) / 2;
  const qx = mx + (CX - mx) * 0.3;
  const qy = my + (CY - my) * 0.3;
  return `M${a.position.x} ${a.position.y} Q${qx} ${qy} ${b.position.x} ${b.position.y}`;
}

/**
 * The interactive JYC map. Everything is one SVG (~140 small elements) with
 * hover handled by CSS, so there is no per-frame JavaScript except the
 * spring-smoothed pointer parallax (desktop only).
 */
export default function Constellation() {
  const { collaborations, domains, getDomain } = useSite();
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const [hovered, setHovered] = useState<string | null>(null);

  // Pointer parallax: far layer moves a little, near layer a little more.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 50, damping: 18, mass: 0.8 });
  const spy = useSpring(py, { stiffness: 50, damping: 18, mass: 0.8 });
  const farX = useTransform(spx, (v) => v * -10);
  const farY = useTransform(spy, (v) => v * -10);
  const nearX = useTransform(spx, (v) => v * -28);
  const nearY = useTransform(spy, (v) => v * -28);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (tier !== "full") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  const go = useCallback(
    (d: Domain, el: Element) => {
      const r = el.getBoundingClientRect();
      travelTo(`/domain/${d.id}`, {
        origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        accent: d.accent,
        label: d.name,
      });
    },
    [travelTo],
  );

  return (
    <div className="absolute inset-0" onPointerMove={onMove}>
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        role="group"
        aria-label="Map of the JYC universe"
      >
        <defs>
          {domains.map((d) => (
            <radialGradient key={d.id} id={`pg-${d.id}`} cx="34%" cy="30%" r="80%">
              <stop offset="0%" stopColor={d.accent} stopOpacity="0.95" />
              <stop offset="55%" stopColor={d.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0b0c0c" stopOpacity="1" />
            </radialGradient>
          ))}
        </defs>

        {/* Hub orbit */}
        <ellipse cx={CX} cy={CY} rx={170} ry={116} fill="none" stroke="#ece7dc" strokeOpacity={0.12} strokeWidth={0.8} />

        {/* Far layer: light from the hub, and collaboration between worlds */}
        <motion.g style={{ x: farX, y: farY }}>
          {domains.map((d) => (
            <path
              key={`spoke-${d.id}`}
              className="cspoke"
              d={`M${CX} ${CY} L${d.position.x} ${d.position.y}`}
              data-hot={hovered === d.id}
              style={{ "--accent": d.accent } as CSSProperties}
            />
          ))}
          {collaborations.map(([a, b]) => {
            const da = getDomain(a);
            const db = getDomain(b);
            if (!da || !db) return null;
            return (
              <path
                key={`${a}-${b}`}
                className="ccollab"
                d={collabPath(da, db)}
                data-hot={hovered === a || hovered === b}
              />
            );
          })}
        </motion.g>

        {/* Near layer: the worlds */}
        <motion.g style={{ x: nearX, y: nearY }}>
          {domains.map((d, i) => {
            const active = hovered === d.id;
            const dim = hovered !== null && !active;
            const lower = d.position.y > CY;
            const labelY = lower ? -118 : 116;

            return (
              <g key={d.id} transform={`translate(${d.position.x} ${d.position.y})`}>
                <g
                  className="domain"
                  data-active={active}
                  data-dim={dim}
                  style={{ "--accent": d.accent } as CSSProperties}
                >
                  <motion.g
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.1, delay: 0.5 + i * 0.14, ease: EASE }}
                  >
                    {d.dust.map(([x, y, r], k) => (
                      <circle key={k} className="cdust" cx={x} cy={y} r={r} />
                    ))}

                    {d.links.map(([a, b], k) => (
                      <path
                        key={k}
                        className="cline"
                        pathLength={1}
                        d={`M${d.stars[a][0]} ${d.stars[a][1]} L${d.stars[b][0]} ${d.stars[b][1]}`}
                        style={{ "--delay": `${0.9 + i * 0.14 + k * 0.1}s` } as CSSProperties}
                      />
                    ))}

                    {d.stars.map(([x, y], k) => (
                      <circle key={k} className="cstar" cx={x} cy={y} r={2.4} />
                    ))}

                    <g className="cplanet">
                      <ellipse className="cring" rx={d.planetRadius * 1.9} ry={d.planetRadius * 0.5} transform={`rotate(${d.tilt})`} />
                      <circle className="chalo" r={d.planetRadius + 14} />
                      <circle r={d.planetRadius} fill={`url(#pg-${d.id})`} />
                    </g>

                    <text className="dname" y={labelY} textAnchor="middle">
                      {d.name}
                    </text>
                    <text className="dtag" y={labelY + 22} textAnchor="middle">
                      {d.tagline}
                    </text>

                    <g
                      className="chit"
                      role="link"
                      tabIndex={0}
                      aria-label={`Travel to ${d.name}: ${d.tagline}`}
                      onPointerEnter={() => setHovered(d.id)}
                      onPointerLeave={() => setHovered((h) => (h === d.id ? null : h))}
                      onFocus={() => setHovered(d.id)}
                      onBlur={() => setHovered((h) => (h === d.id ? null : h))}
                      onClick={(e) => go(d, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          go(d, e.currentTarget);
                        }
                      }}
                    >
                      <circle r={100} />
                    </g>
                  </motion.g>
                </g>
              </g>
            );
          })}
        </motion.g>
      </svg>

      {/* Hub: the real logo sits at the exact centre of the map */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div
          aria-hidden
          className="absolute h-[34vmin] w-[34vmin] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(236,231,220,0.09), rgba(236,231,220,0) 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        >
          <LogoMark size="clamp(84px, 11vmin, 140px)" />
        </motion.div>
      </div>
    </div>
  );
}
