import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Lost in the void", robots: { index: false, follow: true } };

/**
 * 404, in the universe's language: you did not hit an error page, you drifted off the map.
 * Server component, no JS beyond the links. The global star field is already behind it.
 */
export default function NotFound() {
  return (
    <main className="relative grid min-h-[100svh] place-items-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ash">Signal lost · 404</p>

        <h1 className="mt-6 font-display text-[clamp(3.2rem,12vw,8rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
          Nothing
          <br />
          <span className="text-ash">orbits here</span>
        </h1>

        <p className="mt-8 max-w-md text-bone/60">
          This coordinate is empty. The world you were looking for may have been renamed, or it has not been
          charted yet.
        </p>

        <nav aria-label="Ways back" className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm">
          {[
            { href: "/universe", label: "Back to the map" },
            { href: "/clubs", label: "All clubs" },
            { href: "/events", label: "Events" },
            { href: "/", label: "The beginning" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group inline-flex items-center gap-1 border-b border-line pb-1 transition-colors hover:border-bone/70"
            >
              {l.label}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
