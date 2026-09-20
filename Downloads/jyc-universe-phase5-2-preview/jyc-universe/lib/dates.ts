import type { JycEvent } from "./types";

/**
 * Date helpers that work on plain "YYYY-MM-DD" strings, so there is no timezone drift
 * between server and client and no Date parsing surprises.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

export const dayOf = (iso: string) => String(parts(iso).day).padStart(2, "0");
export const monthOf = (iso: string) => MONTHS[parts(iso).month - 1]?.toUpperCase() ?? "";
export const yearOf = (iso: string) => String(parts(iso).year);
export const longDate = (iso: string) => {
  const p = parts(iso);
  return `${p.day} ${MONTHS[p.month - 1] ?? ""} ${p.year}`;
};

/** "Friday, 9 Oct 2026" */
export const fullDate = (iso: string) => {
  const p = parts(iso);
  const wd = WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()] ?? "";
  return `${wd}, ${longDate(iso)}`;
};

/** Whole days from `from` to `to` (both YYYY-MM-DD). Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const a = parts(from);
  const b = parts(to);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
}

/** "Today", "Tomorrow", "In 19 days", "Yesterday", "12 days ago". */
export function whenLabel(iso: string, today: string): string {
  const d = daysBetween(today, iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d > 1) return `In ${d} days`;
  if (d === -1) return "Yesterday";
  return `${-d} days ago`;
}

/** Today's date in the runtime's local timezone as YYYY-MM-DD. */
export function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Upcoming (soonest first) and past (most recent first). ISO strings compare correctly as text. */
export function splitEvents(list: JycEvent[], today: string): { upcoming: JycEvent[]; past: JycEvent[] } {
  return {
    upcoming: list.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: list.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date)),
  };
}
