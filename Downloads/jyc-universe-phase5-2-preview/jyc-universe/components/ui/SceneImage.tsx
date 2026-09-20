import Image from "next/image";

/**
 * The one image component the scenes use.
 *
 * Why a wrapper instead of <Image> everywhere:
 *  - Every photo surface in this project is an absolutely positioned `object-cover` layer inside a
 *    box that already reserves its space (aspect-ratio or aspect-[3/4]). That is exactly what
 *    `fill` is for, and `fill` + `sizes` is what lets Next pick the right width. When the real
 *    pixel size IS known (gallery items carry width/height), it is passed through instead, so the
 *    intrinsic ratio is in the HTML too.
 *  - Content is user-uploaded. A src that is not a configured remote host (a relative path in the
 *    sample content, a data: URI, an http:// link someone pasted into Supabase) would make the
 *    optimiser throw at request time and take the page down. `unoptimized` on those keeps the
 *    site rendering; everything on Supabase Storage still goes through the optimiser.
 *
 * Nothing about the visual result changes: same absolute inset-0 / object-cover layer as the
 * plain <img> it replaces.
 */

/** Hosts next.config.mjs allows the optimiser to fetch. Keep in sync with `remotePatterns`. */
function optimisable(src: string): boolean {
  if (src.startsWith("/")) return true; // local file in public/
  if (!src.startsWith("https://")) return false; // data:, blob:, http:, relative
  try {
    const { hostname, pathname } = new URL(src);
    const isPublicObject = pathname.startsWith("/storage/v1/object/public/");
    if ((hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in")) && isPublicObject) return true;
    const custom = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    if (custom && isPublicObject) {
      try {
        return new URL(custom).hostname === hostname;
      } catch {
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export type SceneImageProps = {
  src: string;
  /** Empty string for decorative photos that sit behind their own caption/heading. */
  alt: string;
  /** Real pixels, when the record knows them. Used for the intrinsic ratio; layout is still `fill`. */
  width?: number;
  height?: number;
  /** Viewport widths this image is drawn at. Always pass one; it decides which file is fetched. */
  sizes: string;
  /** Above the fold (the viewer image, a lead poster). Defaults to lazy. */
  priority?: boolean;
  className?: string;
  /** object-position, for portraits that should not crop faces off. */
  position?: string;
};

export default function SceneImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className = "",
  position,
}: SceneImageProps) {
  const common = {
    src,
    alt,
    sizes,
    priority,
    // Lazy unless it is needed for the first paint. `fetchPriority` is set by `priority`.
    loading: priority ? ("eager" as const) : ("lazy" as const),
    unoptimized: !optimisable(src),
    className: `absolute inset-0 h-full w-full object-cover ${className}`.trim(),
    style: position ? { objectPosition: position } : undefined,
  };

  // `fill` is correct for these layouts: the parent always reserves the box, so nothing shifts.
  // width/height, when known, are still useful metadata, so they are attached as a hint on the
  // wrapper ratio by the caller — here they only affect which srcset widths Next generates.
  if (width && height) {
    return <Image {...common} width={width} height={height} />;
  }
  return <Image {...common} fill />;
}
