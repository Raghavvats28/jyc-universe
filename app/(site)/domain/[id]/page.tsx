import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DomainScene from "@/components/domain/DomainScene";
import { clubsOf, getCity, getDomain, getDomains } from "@/lib/data";

export const revalidate = 300;
// A world added in the database after a build is rendered on first visit instead of a 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getDomains()).map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const domain = await getDomain(params.id);
  if (!domain) return { title: "World not found" };
  const description = `${domain.tagline} ${domain.description}`.trim();
  return {
    title: domain.name,
    description,
    alternates: { canonical: `/domain/${domain.id}` },
    openGraph: { type: "website", title: domain.name, description, url: `/domain/${domain.id}` },
    twitter: { card: "summary_large_image", title: domain.name, description },
  };
}

export default async function DomainPage({ params }: { params: { id: string } }) {
  const domain = await getDomain(params.id);
  if (!domain) notFound();
  const [clubs, city] = await Promise.all([clubsOf(domain.id), getCity(domain.id)]);
  return <DomainScene domain={domain} clubs={clubs} city={city} />;
}
