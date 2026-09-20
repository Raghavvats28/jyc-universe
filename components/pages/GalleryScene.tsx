"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type TouchEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import SceneImage from "@/components/ui/SceneImage";
import Motif from "@/components/club/Motif";
import { FloorHead, MaskLine } from "@/components/club/Reveal";
import { originOf, useTravel } from "@/components/TravelProvider";
import type { ArchiveTile, WorldChip } from "@/lib/archive";
import type { DomainId } from "@/lib/types";
import { EASE } from "@/lib/timing";

/**
 * The visual archive: every club's gallery on one wall.
 * CSS columns keep each photo's own proportions; each tile is a button that opens a full-screen viewer
 * (arrows / Esc / swipe). Tiles without a photo draw their club's motif. Curtains lift on scroll (transform only).
 * Images are lazy, decoded async, and carry width/height so nothing shifts.
 */

const FALLBACK_RATIOS = ["4 / 5", "3 / 2", "1 / 1", "3 / 4", "4 / 3", "2 / 3"];

const ratioOf = (t: ArchiveTile, i: number) =>
  t.item.width && t.item.height ? `${t.item.width} / ${t.item.height}` : FALLBACK_RATIOS[i % FALLBACK_RATIOS.length];

/** The artwork for one frame: the photo, or the club's generated motif tile. */
function Frame({ tile, seed, eager = false }: { tile: ArchiveTile; seed: number; eager?: boolean }) {
  const { item, accent, motif } = tile;
  if (item.src) {
    return (
      <SceneImage
        src={item.src}
        alt={item.alt}
        width={item.width}
        height={item.height}
        priority={eager}
        // Wall: two columns on phones, three from md. Viewer: nearly the whole screen.
        sizes={eager ? "100vw" : "(max-width: 768px) 48vw, (max-width: 1280px) 32vw, 30rem"}
      />
    );
  }
  return (
    <>
      <Motif kind={motif} accent={accent} seed={seed} className="opacity-70" />
      <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 25%, ${accent}22, transparent 65%)` }} />
    </>
  );
}

function GridTile({ tile, index, onOpen }: { tile: ArchiveTile; index: number; onOpen: (i: number, el: HTMLElement) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(index, e.currentTarget)}
      aria-label={`Open frame ${index + 1}, ${tile.clubName}`}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden text-left md:mb-4"
      style={{ aspectRatio: ratioOf(tile, tile.index), background: "#101413" }}
    >
      <span className="absolute inset-0 block transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]">
        <Frame tile={tile} seed={tile.index * 5 + 2} />
      </span>
      <span className="absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.2em] text-bone/70">
        {tile.clubName} · {String(tile.index + 1).padStart(2, "0")}
      </span>
      {/* Curtain that lifts when the tile scrolls into view (transform only) */}
      <motion.span
        aria-hidden
        className="absolute inset-0 block origin-top bg-void"
        initial={{ scaleY: 1 }}
        whileInView={{ scaleY: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 1, delay: (index % 4) * 0.08, ease: EASE }}
      />
    </button>
  );
}

const FOCUSABLE = "button, a[href], [tabindex]:not([tabindex='-1'])";

/** Full-screen viewer. Esc closes, arrows step, swipe steps, Tab stays inside, focus returns to the tile. */
function Viewer({
  tiles,
  index,
  dir,
  onClose,
  onStep,
  onVisit,
  opener,
}: {
  tiles: ArchiveTile[];
  index: number;
  dir: 1 | -1;
  onClose: () => void;
  onStep: (d: 1 | -1) => void;
  onVisit: (tile: ArchiveTile, e: ReactMouseEvent<HTMLButtonElement>) => void;
  opener: HTMLElement | null;
}) {
  const tile = tiles[index];
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const many = tiles.length > 1;

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onStep(-1);
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "Tab" && box.current) {
        const els = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !box.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !box.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  // Warm the neighbours so stepping feels instant.
  useEffect(() => {
    for (const j of [index - 1, index + 1]) {
      const src = tiles[j]?.item.src;
      if (src) new Image().src = src;
    }
  }, [index, tiles]);

  if (!tile) return null;
  const ratio = tile.item.width && tile.item.height ? tile.item.width / tile.item.height : 4 / 3;
  const a = tile.accent;

  return (
    <motion.div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={`${tile.clubName}, frame ${tile.index + 1}`}
      className="fixed inset-0 z-[90] flex flex-col bg-void text-bone"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onTouchStart={(e: TouchEvent) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e: TouchEvent) => {
        const x0 = touchX.current;
        touchX.current = null;
        const x1 = e.changedTouches[0]?.clientX;
        if (x0 === null || x1 === undefined) return;
        if (Math.abs(x1 - x0) > 60) onStep(x1 < x0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <p className="text-sm text-bone/70" aria-live="polite">
          <span style={{ color: a }}>{tile.clubName}</span>
          <span className="ml-3 text-ash">
            {String(index + 1).padStart(2, "0")} / {String(tiles.length).padStart(2, "0")}
          </span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] opacity-80 transition-opacity hover:opacity-100"
        >
          Close <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tile.id}
            className="relative overflow-hidden"
            style={{
              aspectRatio: String(ratio),
              width: `min(92vw, calc(72vh * ${ratio}))`,
              maxHeight: "72vh",
              background: "#101413",
              boxShadow: `inset 0 0 0 1px ${a}33`,
            }}
            initial={{ opacity: 0, x: dir * 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -36 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <Frame tile={tile} seed={tile.index * 5 + 2} eager />
          </motion.div>
        </AnimatePresence>

        {many && (
          <>
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Previous frame"
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center opacity-70 transition-opacity hover:opacity-100 md:left-8"
            >
              <ArrowLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Next frame"
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center opacity-70 transition-opacity hover:opacity-100 md:right-8"
            >
              <ArrowRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm md:px-10 md:py-6">
        <p className="min-w-0 truncate text-bone/60">{tile.item.alt}</p>
        <button
          type="button"
          onClick={(e) => onVisit(tile, e)}
          className="flex shrink-0 items-center gap-1 border-b pb-0.5"
          style={{ color: a, borderColor: `${a}77` }}
        >
          Visit {tile.clubName} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}

export default function GalleryScene({ tiles, worlds }: { tiles: ArchiveTile[]; worlds: WorldChip[] }) {
  const { travelTo } = useTravel();
  const [world, setWorld] = useState<DomainId | "all">("all");
  const [open, setOpen] = useState<{ index: number; dir: 1 | -1 } | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const visible = useMemo(() => (world === "all" ? tiles : tiles.filter((t) => t.domainId === world)), [tiles, world]);
  const current = worlds.find((w) => w.id === world);

  const openAt = useCallback((i: number, el: HTMLElement) => {
    openerRef.current = el;
    setOpen({ index: i, dir: 1 });
  }, []);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: 1 | -1) =>
      setOpen((o) => (o ? { index: (o.index + d + visible.length) % visible.length, dir: d } : o)),
    [visible.length],
  );
  const visit = useCallback(
    (t: ArchiveTile, e: ReactMouseEvent<HTMLButtonElement>) => {
      setOpen(null);
      travelTo(`/club/${t.clubId}`, { origin: originOf(e), accent: t.accent, label: t.clubName });
    },
    [travelTo],
  );

  // Changing the filter closes any open frame.
  useEffect(() => setOpen(null), [world]);

  const onChipKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const i = btns.findIndex((b) => b === document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length]?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
      <section className="px-3 pb-24 pt-28 md:px-6 md:pb-32 md:pt-36">
        <div className="px-2 md:px-6">
          <FloorHead mark="G" name="Visual archive" note={`${tiles.length} frames`} accent="#ece7dc" />
          <h1 className="sr-only">Gallery</h1>
          <MaskLine className="mb-10 font-display text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.88] tracking-[-0.045em] md:mb-14" delay={0.2}>
            Gallery
          </MaskLine>

          <div
            role="group"
            aria-label="Filter by world"
            onKeyDown={onChipKey}
            className="mb-12 flex flex-wrap gap-x-6 gap-y-3 text-sm md:mb-16"
          >
            <button
              type="button"
              aria-pressed={world === "all"}
              onClick={() => setWorld("all")}
              className={`border-b pb-1 transition-opacity ${world === "all" ? "border-bone opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              All <span className="ml-1 text-ash">{tiles.length}</span>
            </button>
            {worlds.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-pressed={world === w.id}
                onClick={() => setWorld(w.id)}
                className={`flex items-center gap-2 border-b pb-1 transition-opacity ${
                  world === w.id ? "opacity-100" : w.count === 0 ? "border-transparent opacity-35 hover:opacity-70" : "border-transparent opacity-60 hover:opacity-100"
                }`}
                style={world === w.id ? ({ borderColor: w.accent } as CSSProperties) : undefined}
              >
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: w.accent }} />
                {w.name.charAt(0)}
                {w.name.slice(1).toLowerCase()}
                <span className="text-ash">{w.count}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="px-2 text-bone/60 md:px-6">
            {current ? `No photos from ${current.name.charAt(0)}${current.name.slice(1).toLowerCase()} yet.` : "Photos will appear here."}
          </p>
        ) : (
          // key: switching worlds remounts the wall so every curtain lifts again
          <div key={world} className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4">
            {visible.map((t, i) => (
              <GridTile key={t.id} tile={t} index={i} onOpen={openAt} />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {open && visible.length > 0 && (
          <Viewer tiles={visible} index={Math.min(open.index, visible.length - 1)} dir={open.dir} onClose={close} onStep={step} onVisit={visit} opener={openerRef.current} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
