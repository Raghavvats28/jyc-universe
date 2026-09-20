"use client";

import type { ClubIdentity } from "@/lib/identity";
import type { Club } from "@/lib/types";
import SceneImage from "@/components/ui/SceneImage";
import Motif from "../Motif";
import { FloorHead, MaskLine, Reveal } from "../Reveal";

const OFFSETS = ["md:mt-0", "md:mt-16", "md:mt-6", "md:mt-24"];

/** A stylised bust, used when a coordinator has no photo yet. */
function Silhouette({ accent }: { accent: string }) {
  return (
    <svg aria-hidden viewBox="0 0 300 400" className="absolute inset-x-0 bottom-0 h-[86%] w-full" preserveAspectRatio="xMidYMax meet">
      <circle cx="150" cy="140" r="54" fill={accent} fillOpacity="0.28" />
      <path d="M36 400C36 300 96 244 150 244s114 56 114 156Z" fill={accent} fillOpacity="0.22" />
    </svg>
  );
}

/** Floor 1: coordinators as tall portraits, staggered like a magazine spread. */
export default function TeamFloor({ club, identity }: { club: Club; identity: ClubIdentity }) {
  const a = identity.accent;
  const people = club.coordinators;

  return (
    <section id="floor-team" aria-label="Team" tabIndex={-1} className="outline-none relative px-5 py-24 md:px-12 md:py-40">
      <FloorHead mark="1" name="Team" note={people.length ? `${people.length} people` : undefined} accent={a} />

      <MaskLine className="mb-14 font-display text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] md:mb-20">
        The people
        <br />
        <span style={{ color: a }}>behind {club.name}</span>
      </MaskLine>

      {people.length === 0 ? (
        <p className="text-bone/60">Coordinators will appear here.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {people.map((p, i) => (
            <li key={`${p.role}-${i}`} className={OFFSETS[i % OFFSETS.length]}>
              <Reveal delay={(i % 4) * 0.08}>
                <figure>
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ background: "#101413", boxShadow: `inset 0 0 0 1px ${a}33` }}>
                    {p.photo ? (
                      <SceneImage
                        src={p.photo}
                        alt={p.name}
                        // Two columns on phones, four from md up (max column ~20rem).
                        sizes="(max-width: 768px) 46vw, (max-width: 1280px) 22vw, 20rem"
                        // Portraits: bias the crop upward so faces survive the 3/4 box.
                        position="50% 30%"
                      />
                    ) : (
                      <>
                        <Motif kind={identity.motif} accent={a} seed={i + 11} className="opacity-60" />
                        <Silhouette accent={a} />
                      </>
                    )}
                    <span className="absolute left-3 top-3 text-[11px] tabular-nums tracking-[0.2em] text-bone/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <figcaption className="mt-4">
                    <span className="block font-display text-xl font-semibold tracking-tight md:text-2xl">{p.name}</span>
                    <span className="mt-1 block text-sm" style={{ color: a }}>
                      {p.role}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
