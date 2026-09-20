"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, resourceOf } from "@/lib/admin/resources";

/** The left rail. Client-only so the current section can be highlighted without a prop drill. */
export default function Sidebar() {
  const pathname = usePathname();
  const section = pathname.split("/")[2] ?? "";

  return (
    <nav className="ah-nav ah-panel sticky top-6 h-fit w-full p-3 lg:w-60" aria-label="Sections">
      <Link href="/admin" aria-current={section === "" ? "page" : undefined}>
        <span aria-hidden>⌂</span> Dashboard
      </Link>

      {NAV.map((key, i) =>
        key === null ? (
          <hr key={`d-${i}`} className="my-2 border-0 border-t" style={{ borderColor: "var(--edge)" }} />
        ) : (
          (() => {
            const r = resourceOf(key);
            if (!r) return null;
            return (
              <Link key={key} href={`/admin/${key}`} aria-current={section === key ? "page" : undefined}>
                <span aria-hidden>{r.icon}</span> {r.many}
              </Link>
            );
          })()
        ),
      )}

      <hr className="my-2 border-0 border-t" style={{ borderColor: "var(--edge)" }} />
      <Link href="/admin/admins" aria-current={section === "admins" ? "page" : undefined}>
        <span aria-hidden>☆</span> Administrators
      </Link>
    </nav>
  );
}
