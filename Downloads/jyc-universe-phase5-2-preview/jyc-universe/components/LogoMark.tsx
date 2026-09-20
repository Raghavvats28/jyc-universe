"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The logo, as a sun: the real JYC badge in the middle, an amber corona behind it, one thin ring,
 * and a few small planets in orbit. Only the badge image itself is never redrawn or restyled — the
 * glow and orbits are new set dressing around it, not a modification of the artwork.
 *
 * All motion is transform/opacity on absolutely positioned layers (see `.logo-orbit` in
 * app/globals.css) and stops entirely under prefers-reduced-motion. Until /public/jyc-logo.png
 * exists, the wordmark fallback still applies — the sun dressing only draws once the real image
 * has loaded, so a missing logo never shows an empty glow with nothing at its centre.
 */
export default function LogoMark({ size = "clamp(140px, 24vmin, 280px)" }: { size?: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // onError can fire before hydration, so re-check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span
        className="grid place-items-center font-display font-semibold tracking-[0.2em] text-bone"
        style={{ width: size, height: size, fontSize: `calc(${size} * 0.3)` }}
      >
        JYC
      </span>
    );
  }

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Corona: a soft amber bloom behind the disc, like the sun it is standing in for. */}
      <div aria-hidden className="logo-corona absolute rounded-full" style={{ width: "175%", height: "175%" }} />

      {/* Two orbit rings, offset so their planets never collide. */}
      <div aria-hidden className="logo-orbit absolute rounded-full" style={{ width: "148%", height: "148%" }}>
        <span className="logo-planet logo-planet--a" />
        <span className="logo-planet logo-planet--b" />
      </div>
      <div aria-hidden className="logo-orbit logo-orbit--slow absolute rounded-full" style={{ width: "128%", height: "128%" }}>
        <span className="logo-planet logo-planet--c" />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/jyc-logo.png"
        alt="Jaypee Youth Club logo"
        onError={() => setFailed(true)}
        decoding="async"
        draggable={false}
        className="relative rounded-full"
        style={{ width: size, height: size, objectFit: "cover", boxShadow: "0 0 0 1px rgba(232,194,122,0.35)" }}
      />
    </div>
  );
}
