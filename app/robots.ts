import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

/** Serves /robots.txt. Everything is public and crawlable; only Next's internals are hidden. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing useful to a crawler, and /dev/* is for building the eagle in Phase 4.
        // /admin is a tool, and its pages also send a noindex header of their own.
        disallow: ["/_next/", "/api/", "/dev/", "/admin/"],
      },
    ],
    sitemap: absolute("/sitemap.xml"),
    host: absolute("/"),
  };
}
