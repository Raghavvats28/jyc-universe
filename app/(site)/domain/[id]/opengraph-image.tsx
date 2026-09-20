import { getDomain } from "@/lib/data";
import { ogScene, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "A world in the JYC universe";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** A world's card uses the world's own accent, the same one its planet is drawn with. */
export default async function Image({ params }: { params: { id: string } }) {
  const domain = await getDomain(params.id);
  if (!domain) return ogScene({ title: "JYC", accent: "#ece7dc" });
  return ogScene({ kicker: "A world of JYC", title: domain.name, sub: domain.tagline, accent: domain.accent });
}
