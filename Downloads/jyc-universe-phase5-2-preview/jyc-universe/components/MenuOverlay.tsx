"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "./SiteProvider";
import { EASE } from "@/lib/timing";
import { originOf, useTravel } from "./TravelProvider";

type Item = { label: string; href?: string; note?: string };

const ITEMS: Item[] = [
  { label: "Universe", href: "/universe" },
  { label: "Worlds" }, // expands to the six domains
  { label: "Events", href: "/events" },
  { label: "Clubs", href: "/clubs" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
];

export default function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { domains } = useSite();
  const { travelTo } = useTravel();
  const [worldsOpen, setWorldsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence onExitComplete={() => setWorldsOpen(false)}>
      {open && (
        <motion.div
          id="jyc-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-[75] overflow-y-auto bg-void/[0.97] px-5 pb-12 pt-28 md:px-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <ul className="mx-auto max-w-5xl">
            {ITEMS.map((item, i) => {
              const isWorlds = item.label === "Worlds";
              return (
                <li key={item.label} className="border-b border-line">
                  <div className="overflow-hidden">
                    <motion.div
                      initial={{ y: "105%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.7, delay: 0.08 + i * 0.05, ease: EASE }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-baseline justify-between gap-6 py-3 text-left md:py-4"
                        aria-expanded={isWorlds ? worldsOpen : undefined}
                        onClick={(e) => {
                          if (isWorlds) {
                            setWorldsOpen((o) => !o);
                            return;
                          }
                          onClose();
                          travelTo(item.href!, { origin: originOf(e), label: item.label });
                        }}
                      >
                        <span className="font-display text-[clamp(2.4rem,8vw,6rem)] font-semibold leading-none tracking-tight text-bone transition-opacity hover:opacity-70">
                          {item.label}
                        </span>
                        <span className="text-sm text-ash">
                          {isWorlds ? (worldsOpen ? "Hide" : `${domains.length} worlds`) : item.note}
                        </span>
                      </button>
                    </motion.div>
                  </div>

                  {isWorlds && (
                    <AnimatePresence initial={false}>
                      {worldsOpen && (
                        <motion.ul
                          className="grid grid-cols-2 gap-x-6 gap-y-1 overflow-hidden pb-5 md:grid-cols-3"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                        >
                          {domains.map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                className="flex items-center gap-3 py-2 text-left font-display text-xl font-medium text-bone/80 transition-colors hover:text-bone"
                                onClick={(e) => {
                                  onClose();
                                  travelTo(`/domain/${d.id}`, {
                                    origin: originOf(e),
                                    accent: d.accent,
                                    label: d.name,
                                  });
                                }}
                              >
                                <span
                                  aria-hidden
                                  className="h-2 w-2 rounded-full"
                                  style={{ background: d.accent }}
                                />
                                {d.name.charAt(0)}
                                {d.name.slice(1).toLowerCase()}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
