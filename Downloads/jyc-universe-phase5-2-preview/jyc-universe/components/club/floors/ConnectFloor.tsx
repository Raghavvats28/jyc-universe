"use client";

import type { MouseEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ClubIdentity } from "@/lib/identity";
import type { Club, Domain } from "@/lib/types";
import { FloorHead, MaskLine, Reveal } from "../Reveal";

export interface ClubNav {
  toCity: (e: MouseEvent<HTMLElement>) => void;
  toUniverse: (e: MouseEvent<HTMLElement>) => void;
  toClub: (club: Club, e: MouseEvent<HTMLElement>) => void;
}

const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Roof: socials, contact, and the way back (previous club, next club, city, universe). */
export default function ConnectFloor({
  club,
  domain,
  identity,
  prev,
  next,
  nav,
}: {
  club: Club;
  domain: Domain;
  identity: ClubIdentity;
  prev?: Club;
  next?: Club;
  nav: ClubNav;
}) {
  const a = identity.accent;
  const s = club.socials;
  const rows = [
    { label: "Instagram", value: s.instagram ? bare(s.instagram) : undefined, href: s.instagram },
    { label: "LinkedIn", value: s.linkedin ? bare(s.linkedin) : undefined, href: s.linkedin },
    { label: "Website", value: s.website ? bare(s.website) : undefined, href: s.website },
    { label: "Email", value: s.email, href: s.email ? `mailto:${s.email}` : undefined },
  ];
  const cityName = `${domain.name.charAt(0)}${domain.name.slice(1).toLowerCase()} city`;

  return (
    <section id="floor-connect" aria-label="Connect" tabIndex={-1} className="outline-none relative px-5 pb-16 pt-24 md:px-12 md:pb-20 md:pt-40">
      <FloorHead mark="R" name="Connect" accent={a} />

      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
        <MaskLine className="font-display text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.045em]">
          Say
          <br />
          <span style={{ color: a }}>hello.</span>
        </MaskLine>

        <Reveal delay={0.15} className="self-end">
          <ul className="border-t border-line">
            {rows.map((r) => {
              const inner = (
                <>
                  <span className="text-sm text-ash">{r.label}</span>
                  <span className="flex items-center gap-2 font-display text-lg font-medium tracking-tight md:text-xl">
                    {r.value ?? <span className="text-bone/35">Not linked yet</span>}
                    {r.href && <ArrowUpRight className="h-4 w-4" style={{ color: a }} aria-hidden />}
                  </span>
                </>
              );
              return (
                <li key={r.label} className="border-b border-line">
                  {r.href ? (
                    <a
                      href={r.href}
                      target={r.label === "Email" ? undefined : "_blank"}
                      rel="noreferrer"
                      className="club-sweep flex items-baseline justify-between gap-4 py-4"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="flex items-baseline justify-between gap-4 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>

      {/* The way back */}
      <nav aria-label="Leave the club space" className="mt-24 grid border-t border-line md:mt-36 md:grid-cols-3">
        {prev ? (
          <button
            type="button"
            onClick={(e) => nav.toClub(prev, e)}
            className="group border-b border-line py-8 text-left md:border-b-0 md:border-r md:pr-8"
          >
            <span className="flex items-center gap-2 text-sm text-ash">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous club
            </span>
            <span className="mt-2 block font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-[var(--accent)] md:text-4xl">
              {prev.name}
            </span>
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={nav.toCity}
          className="group border-b border-line py-8 text-left md:border-b-0 md:border-r md:px-8"
        >
          <span className="text-sm text-ash">Back to</span>
          <span className="mt-2 block font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-[var(--accent)] md:text-4xl">
            {cityName}
          </span>
        </button>
        {next ? (
          <button type="button" onClick={(e) => nav.toClub(next, e)} className="group py-8 text-left md:pl-8">
            <span className="flex items-center gap-2 text-sm text-ash">
              Next club <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="mt-2 block font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-[var(--accent)] md:text-4xl">
              {next.name}
            </span>
          </button>
        ) : (
          <div />
        )}
      </nav>

      <div className="mt-6 flex items-center justify-between text-sm text-ash">
        <button type="button" onClick={nav.toUniverse} className="border-b border-bone/30 pb-0.5 transition-colors hover:border-bone hover:text-bone">
          Back to the universe
        </button>
        <span>{club.name} · Jaypee Youth Club</span>
      </div>
    </section>
  );
}
