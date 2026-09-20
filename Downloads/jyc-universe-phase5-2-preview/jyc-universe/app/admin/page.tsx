import Link from "next/link";
import { counts } from "@/lib/admin/query";
import { RESOURCES } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

/** What exists, at a glance, and a way into each section. */
export default async function Dashboard() {
  const tables = Array.from(new Set(RESOURCES.map((r) => r.table)));
  let totals: Record<string, number> = {};
  let failed = false;
  try {
    totals = await counts(tables);
  } catch {
    // The panel should still render if one count query fails; the sections themselves will say why.
    failed = true;
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h2>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        Everything on the public site comes from these tables. Edits appear immediately — no deploy, no code.
      </p>

      {failed && (
        <p className="ah-note ah-note--bad mt-5">
          Could not read the database. Check that both SQL files have been run and that your account is in the
          admins table.
        </p>
      )}

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {RESOURCES.map((r) => (
          <Link key={r.key} href={`/admin/${r.key}`} className="ah-row block px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                <span aria-hidden className="mr-2" style={{ color: "var(--amber)" }}>
                  {r.icon}
                </span>
                {r.many}
              </span>
              <span className="font-display text-2xl tabular-nums" style={{ color: "var(--amber)" }}>
                {totals[r.table] ?? "—"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {r.blurb}
            </p>
          </Link>
        ))}
      </div>

      <div className="ah-panel mt-8 p-5">
        <h3 className="font-semibold">Where things show up</h3>
        <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <li>A world needs a layout in the code to have a city. City Map only moves buildings within it.</li>
          <li>Photo and poster URLs must be public Supabase Storage links, or the optimiser skips them.</li>
          <li>Slugs are public web addresses. They cannot be edited after creation, only recreated.</li>
          <li>Deleting a world or a club deletes everything inside it.</li>
        </ul>
      </div>
    </div>
  );
}
