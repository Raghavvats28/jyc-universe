/**
 * The orb you clicked is the origin of the trip into the event page. We remember where it was
 * (viewport pixels) so the big portal on the detail page can grow out of that exact spot.
 * sessionStorage only; if it is missing the portal just grows in place.
 */

const KEY = "jyc.event-orb";

export type Origin = { x: number; y: number };

export function centerOf(el: Element): Origin {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function rememberOrb(id: string, origin: Origin): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ id, x: Math.round(origin.x), y: Math.round(origin.y) }));
  } catch {
    /* private mode: harmless */
  }
}

/** One-shot: returns the remembered origin for this event, then forgets it. */
export function takeOrb(id: string): Origin | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { id?: string; x?: number; y?: number };
    if (v.id !== id || typeof v.x !== "number" || typeof v.y !== "number") return null;
    return { x: v.x, y: v.y };
  } catch {
    return null;
  }
}
