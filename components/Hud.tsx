"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, X } from "lucide-react";
import MenuOverlay from "./MenuOverlay";
import LogoMark from "./LogoMark";
import { useSite } from "./SiteProvider";
import { originOf, useTravel } from "./TravelProvider";

type Site = ReturnType<typeof useSite>;

function whereAmI(pathname: string, { getClub, getDomain, getEvent }: Site): string {
  if (pathname === "/") return "";
  if (pathname === "/universe") return "The universe";
  if (pathname.startsWith("/domain/")) {
    const d = getDomain(pathname.split("/")[2] ?? "");
    return d ? `${d.name.charAt(0)}${d.name.slice(1).toLowerCase()} world` : "";
  }
  if (pathname.startsWith("/club/")) {
    const c = getClub(pathname.split("/")[2] ?? "");
    const d = c ? getDomain(c.domain) : undefined;
    return c && d ? `${c.name} · ${d.name.charAt(0)}${d.name.slice(1).toLowerCase()}` : "";
  }
  if (pathname.startsWith("/events/")) {
    const e = getEvent(pathname.split("/")[2] ?? "");
    const c = e ? getClub(e.clubId) : undefined;
    return e ? `${e.title}${c ? ` · ${c.name}` : ""}` : "Events";
  }
  const section = pathname.slice(1);
  return section.charAt(0).toUpperCase() + section.slice(1);
}

/** The only persistent chrome: JYC (home), where you are, MAP, MENU. */
export default function Hud() {
  const { travelTo } = useTravel();
  const site = useSite();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const onMap = pathname === "/universe";

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between px-5 py-4 text-bone md:px-10 md:py-7"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={(e) => travelTo("/", { origin: originOf(e), label: "JYC" })}
          className="flex items-center gap-2.5"
          aria-label="JYC, back to the opening"
        >
          {/*
            Same sun-and-planets mark as the opening screen and the mobile world list
            (components/LogoMark.tsx), just small enough to sit in the header. It carries its own
            corona/orbit CSS, so nothing extra is needed here for it to match.
          */}
          <LogoMark size="30px" />
          <span className="font-display text-base font-semibold tracking-[0.34em]">JYC</span>
        </button>

        <span className="hidden text-sm text-ash md:block" aria-live="polite">
          {whereAmI(pathname, site)}
        </span>

        <nav className="flex items-center gap-7 text-[11px] font-medium uppercase tracking-[0.24em]">
          <button
            type="button"
            onClick={(e) => {
              closeMenu();
              travelTo("/universe", { origin: originOf(e), label: "Universe" });
            }}
            aria-current={onMap ? "page" : undefined}
            className={`flex items-center gap-2 transition-opacity ${onMap ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Map
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="jyc-menu"
            className="flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100"
          >
            {menuOpen ? (
              <>
                Close <X className="h-3.5 w-3.5" aria-hidden />
              </>
            ) : (
              "Menu"
            )}
          </button>
        </nav>
      </motion.header>

      <MenuOverlay open={menuOpen} onClose={closeMenu} />
    </>
  );
}
