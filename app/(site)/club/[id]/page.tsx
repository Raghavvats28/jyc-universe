import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClubScene from "@/components/club/ClubScene";
import { getCity, getClub, getClubs, getDomain, eventsOf, neighboursOf } from "@/lib/data";
import { identityFor } from "@/lib/identity";

export const revalidate = 300;
// Clubs added in the database after a build are rendered on first visit (then cached), not a 404.
// Unknown ids still 404 through notFound() below.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getClubs()).map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const club = await getClub(params.id);
  if (!club) return { title: "Club not found" };
  const domain = await getDomain(club.domain);
  const title = `${club.name}${domain ? ` · ${domain.name}` : ""}`;
  const description = club.tagline || `${club.name}, a club in the JYC universe.`;
  return {
    title,
    description,
    alternates: { canonical: `/club/${club.id}` },
    // The card is app/club/[id]/opengraph-image.tsx, in the club's own accent.
    openGraph: { type: "profile", title, description, url: `/club/${club.id}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ClubPage({ params }: { params: { id: string } }) {
  const club = await getClub(params.id);
  if (!club) notFound();
  const domain = await getDomain(club.domain);
  if (!domain) notFound();

  const [{ prev, next }, events, city] = await Promise.all([
    neighboursOf(club.id),
    eventsOf(club.id),
    getCity(domain.id),
  ]);

  return (
    <ClubScene
      club={club}
      domain={domain}
      identity={identityFor(club, domain)}
      events={events}
      // Rendered with the build-time date; the client corrects it to the visitor's real date on mount.
      todayISO={new Date().toISOString().slice(0, 10)}
      prev={prev}
      next={next}
      hasCity={Boolean(city)}
    />
  );
}
