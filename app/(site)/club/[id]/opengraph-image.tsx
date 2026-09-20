import { getClub, getDomain } from "@/lib/data";
import { identityFor } from "@/lib/identity";
import { ogScene, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "A club in the JYC universe";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Each club's card carries its own accent, so a shared link already looks like that club. */
export default async function Image({ params }: { params: { id: string } }) {
  const club = await getClub(params.id);
  if (!club) return ogScene({ title: "JYC", accent: "#ece7dc" });
  const domain = await getDomain(club.domain);
  const accent = domain ? identityFor(club, domain).accent : "#ece7dc";
  return ogScene({ kicker: domain?.name, title: club.name, sub: club.tagline, accent });
}
