import { ogScene, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { SITE_TAGLINE } from "@/lib/seo";

export const alt = "JYC — Jaypee Youth Club";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The default share card for every page that does not generate its own. */
export default function Image() {
  return ogScene({ kicker: "Enter the universe", title: "JYC", sub: SITE_TAGLINE, accent: "#ece7dc" });
}
