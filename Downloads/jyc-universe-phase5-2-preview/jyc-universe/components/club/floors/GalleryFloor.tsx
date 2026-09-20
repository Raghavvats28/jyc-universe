"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/timing";
import type { ClubIdentity } from "@/lib/identity";
import type { Club, GalleryItem } from "@/lib/types";
import SceneImage from "@/components/ui/SceneImage";
import Motif from "../Motif";
import { FloorHead, MaskLine } from "../Reveal";

const FALLBACK_RATIOS = ["4 / 5", "3 / 2", "1 / 1", "3 / 4", "4 / 3", "2 / 3"];

function Tile({ item, index, identity, clubName }: { item: GalleryItem; index: number; identity: ClubIdentity; clubName: string }) {
  const ratio = item.width && item.height ? `${item.width} / ${item.height}` : FALLBACK_RATIOS[index % FALLBACK_RATIOS.length];
  const a = identity.accent;

  return (
    <figure className="group relative mb-3 break-inside-avoid overflow-hidden md:mb-4" style={{ aspectRatio: ratio, background: "#101413" }}>
      <div className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]">
        {item.src ? (
          <SceneImage
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            // Two columns on phones, three from md up.
            sizes="(max-width: 768px) 48vw, (max-width: 1280px) 32vw, 30rem"
          />
        ) : (
          <>
            <Motif kind={identity.motif} accent={a} seed={index * 5 + 2} className="opacity-70" />
            <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 25%, ${a}22, transparent 65%)` }} />
          </>
        )}
      </div>
      <figcaption className="absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.2em] text-bone/70">
        {clubName} · {String(index + 1).padStart(2, "0")}
      </figcaption>
      {/* Curtain that lifts when the tile scrolls into view (transform only) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 origin-top bg-void"
        initial={{ scaleY: 1 }}
        whileInView={{ scaleY: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 1, delay: (index % 3) * 0.08, ease: EASE }}
      />
    </figure>
  );
}

/** Floor 4: a large visual wall. Columns keep each photo's own proportions. */
export default function GalleryFloor({ club, identity }: { club: Club; identity: ClubIdentity }) {
  const a = identity.accent;
  const items = club.gallery;

  return (
    <section id="floor-gallery" aria-label="Gallery" tabIndex={-1} className="outline-none relative px-3 py-24 md:px-6 md:py-40">
      <div className="px-2 md:px-6">
        <FloorHead mark="4" name="Gallery" note={items.length ? `${items.length} frames` : undefined} accent={a} />
        <MaskLine className="mb-12 font-display text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] md:mb-16">
          The <span style={{ color: a }}>wall</span>
        </MaskLine>
      </div>

      {items.length === 0 ? (
        <p className="px-2 text-bone/60 md:px-6">Photos will appear here.</p>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 md:gap-4">
          {items.map((it, i) => (
            <Tile key={`${it.src}-${i}`} item={it} index={i} identity={identity} clubName={club.name} />
          ))}
        </div>
      )}
    </section>
  );
}
