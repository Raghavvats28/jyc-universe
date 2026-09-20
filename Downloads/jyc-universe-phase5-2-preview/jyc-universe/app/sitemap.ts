import type { MetadataRoute } from "next";
import { getClubs, getDomains, getEvents } from "@/lib/data";
import { absolute } from "@/lib/seo";

export const revalidate = 300;

/**
 * Serves /sitemap.xml, built from the same data the pages are.
 * Priorities follow the journey: opening > universe > worlds > clubs > events.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absolute("/universe"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absolute("/clubs"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absolute("/events"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absolute("/gallery"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absolute("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [domains, clubs, events] = await Promise.all([getDomains(), getClubs(), getEvents()]);

  return [
    ...fixed,
    ...domains.map((d) => ({
      url: absolute(`/domain/${d.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...clubs.map((c) => ({
      url: absolute(`/club/${c.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...events.map((e) => ({
      // An event's own date is the closest thing it has to a modified time.
      url: absolute(`/events/${e.id}`),
      lastModified: new Date(`${e.date}T00:00:00Z`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
