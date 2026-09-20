"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Route-level error boundary. Data comes from Supabase, and lib/data.ts deliberately throws when a
 * query fails rather than quietly serving placeholders, so this is the screen a reader would see
 * during an outage. It stays in the universe's voice and offers the one useful action: try again.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Digest is the only safe identifier to show; the message itself may contain internals.
    console.error("[JYC] scene failed to load", error);
  }, [error]);

  return (
    <main className="relative grid min-h-[100svh] place-items-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ash">Transmission interrupted</p>

        <h1 className="mt-6 font-display text-[clamp(2.8rem,10vw,6.5rem)] font-semibold leading-[0.88] tracking-[-0.05em]">
          The scene
          <br />
          <span className="text-ash">did not arrive</span>
        </h1>

        <p className="mt-8 max-w-md text-bone/60">
          Something broke on the way here. Nothing you did caused it. Try the jump again, or head back to the
          map.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex items-center gap-2 border-b border-line pb-1 transition-colors hover:border-bone/70"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" aria-hidden />
            Try again
          </button>
          <Link href="/universe" className="border-b border-line pb-1 transition-colors hover:border-bone/70">
            Back to the map
          </Link>
        </div>

        {error.digest && (
          <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-ash/70">Reference {error.digest}</p>
        )}
      </div>
    </main>
  );
}
