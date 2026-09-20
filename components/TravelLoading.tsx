/**
 * What sits under TravelProvider's cover circle while a route is still rendering.
 *
 * How it fits travelTo(): the cover grows from the click point, the route swaps underneath it,
 * and the cover only fades once the new pathname is live. If that route has to fetch, Next shows
 * this file first — so the reader sees rings breathing out of the middle of the screen, the exact
 * place the cover collapsed into, and then the real scene replaces them. It never looks like a
 * different UI; it looks like the jump taking a moment.
 *
 * Server component. No JS ships for it. All animation is CSS (app/globals.css, `.tl-*`) and stops
 * entirely under prefers-reduced-motion.
 */
export default function TravelLoading({
  label = "Arriving",
  accent = "#ece7dc",
}: {
  /** What is being travelled to, e.g. "Entering the club". Keep it short. */
  label?: string;
  accent?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative grid min-h-[100svh] place-items-center overflow-hidden px-6"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <div
          className="tl-ring h-[48vmin] w-[48vmin] rounded-full"
          style={{ border: `1px solid ${accent}`, boxShadow: `0 0 80px -20px ${accent}` }}
        />
        <div
          className="tl-ring tl-ring--late absolute h-[48vmin] w-[48vmin] rounded-full"
          style={{ border: `1px solid ${accent}` }}
        />
      </div>

      <span className="tl-label relative text-[11px] uppercase tracking-[0.3em] text-bone/70">{label}</span>
    </div>
  );
}
