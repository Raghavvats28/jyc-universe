/**
 * One place for everything the crawler and the share card need.
 * Pure strings + a base URL; safe to import from server or client code.
 */

export const SITE_NAME = "JYC · Jaypee Youth Club";
export const SITE_TAGLINE = "A place you travel through, not a page you scroll.";
export const SITE_DESCRIPTION =
  "Jaypee Youth Club as a universe: six worlds, their cities, every club, and every event. Step in.";

/**
 * Absolute origin. Needed for Open Graph (relative URLs are not allowed there), the sitemap and
 * canonicals. Set NEXT_PUBLIC_SITE_URL in production; Vercel's own var is the fallback.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export const absolute = (path: string): string => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

/** The six worlds' accents, used by the generated OG images so a share card feels like its world. */
export const OG_SIZE = { width: 1200, height: 630 };
