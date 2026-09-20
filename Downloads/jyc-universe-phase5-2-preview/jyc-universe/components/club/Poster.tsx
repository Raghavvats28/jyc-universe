import { ArrowUpRight } from "lucide-react";
import { dayOf, monthOf, yearOf } from "@/lib/dates";
import type { ClubIdentity } from "@/lib/identity";
import type { JycEvent } from "@/lib/types";
import SceneImage from "@/components/ui/SceneImage";
import Motif from "./Motif";

function seedOf(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h + 1;
}

/**
 * An event as a typographic poster. If the event has a real poster image it is used;
 * otherwise the poster is generated from the club's identity (motif + type).
 */
export default function Poster({
  event,
  clubName,
  identity,
  size,
  past = false,
  linked = false,
}: {
  event: JycEvent;
  clubName: string;
  identity: ClubIdentity;
  size: "lead" | "small";
  past?: boolean;
  /** The poster sits inside a link to the event page: show "Open event" instead of a nested Register link. */
  linked?: boolean;
}) {
  const lead = size === "lead";
  const a = identity.accent;

  return (
    <article
      className={`relative aspect-[3/4] shrink-0 snap-start overflow-hidden ${
        lead ? "w-[72vw] sm:w-[19rem] lg:w-[22rem]" : "w-[46vw] sm:w-[13rem] lg:w-[14.5rem]"
      }`}
      style={{ background: "#101413", boxShadow: `inset 0 0 0 1px ${a}${past ? "22" : "55"}` }}
      aria-label={`${event.title}, ${event.date}`}
    >
      {event.poster ? (
        <SceneImage
          src={event.poster}
          alt=""
          priority={lead && !past}
          // Lead posters are ~22rem on desktop, small ones ~14.5rem; on phones they are a screen fraction.
          sizes={lead ? "(max-width: 640px) 72vw, (max-width: 1024px) 19rem, 22rem" : "(max-width: 640px) 46vw, (max-width: 1024px) 13rem, 14.5rem"}
        />
      ) : (
        <Motif kind={identity.motif} accent={a} seed={seedOf(event.id)} className={past ? "opacity-40" : "opacity-80"} />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(11,12,12,0.15) 0%, rgba(11,12,12,0.05) 35%, rgba(11,12,12,0.88) 100%)" }}
      />

      <div className={`relative flex h-full flex-col justify-between ${lead ? "p-5" : "p-4"} ${past ? "opacity-75" : ""}`}>
        <div className="flex items-start justify-between text-[11px] font-medium uppercase tracking-[0.22em]">
          <span style={{ color: a }}>{clubName}</span>
          <span className="text-bone/60">{past ? "Past" : "Upcoming"}</span>
        </div>

        <div>
          <div className="flex items-end gap-3">
            <span
              className={`font-display font-semibold leading-[0.8] tracking-[-0.06em] ${
                lead ? "text-[6.2rem] lg:text-[7.4rem]" : "text-[4.2rem]"
              }`}
              style={{ color: past ? "#ece7dc" : a }}
            >
              {dayOf(event.date)}
            </span>
            <span className={`pb-1 leading-tight ${lead ? "text-base" : "text-xs"}`}>
              <span className="block font-semibold tracking-[0.18em]">{monthOf(event.date)}</span>
              <span className="block text-bone/60">{yearOf(event.date)}</span>
            </span>
          </div>

          <h3 className={`mt-4 font-display font-semibold leading-[0.95] tracking-tight ${lead ? "text-3xl" : "text-xl"}`}>
            {event.title}
          </h3>
          <p className={`mt-2 text-bone/60 ${lead ? "text-sm" : "text-xs"}`}>
            {event.time} · {event.location}
          </p>

          {linked ? (
            <div className="mt-4 text-sm">
              <span
                className="inline-flex items-center gap-1 border-b pb-0.5"
                style={{ borderColor: past ? "#ece7dc55" : a, color: past ? "#ece7dcb3" : a }}
              >
                Open event <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          ) : (
            !past && (
              <div className="mt-4 text-sm">
                {event.registrationUrl ? (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border-b pb-0.5"
                    style={{ borderColor: a, color: a }}
                  >
                    Register <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : (
                  <span className="text-ash">Details soon</span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}
