/** @type {import('next').NextConfig} */

/**
 * Remote image hosts.
 *
 * Every photo (posters, coordinator portraits, gallery frames) lives in Supabase Storage, which
 * serves from `<project-ref>.supabase.co/storage/v1/object/public/...`. The project ref is only
 * known from the env vars, so the exact host is derived at build time and a wildcard is kept as a
 * fallback for previews and self-hosted/custom-domain Supabase.
 */
const supabaseHost = (() => {
  const raw = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  try {
    return raw ? new URL(raw).hostname : "";
  } catch {
    return "";
  }
})();

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [
  // Any Supabase project, public storage objects only.
  { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
  { protocol: "https", hostname: "*.supabase.in", pathname: "/storage/v1/object/public/**" },
];

if (supabaseHost && !supabaseHost.endsWith(".supabase.co") && !supabaseHost.endsWith(".supabase.in")) {
  // Custom domain in front of Supabase Storage.
  remotePatterns.push({ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" });
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Cheap win: both are barrel files. This rewrites `import { motion } from "framer-motion"`
    // to the exact submodule, so a route that only uses <motion.div> stops pulling the whole
    // package's index into its chunk. No source changes, no behaviour change.
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  images: {
    remotePatterns,
    // AVIF first, WebP second: both are much smaller than the source JPEGs the clubs upload.
    formats: ["image/avif", "image/webp"],
    // Widths the layouts actually ask for (see `sizes` in components/ui/SceneImage.tsx).
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 224, 320, 384],
    // Optimised files are immutable content; cache them for a day at the edge.
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
