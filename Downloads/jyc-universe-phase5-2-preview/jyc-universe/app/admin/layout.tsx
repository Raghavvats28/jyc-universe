import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { signOut } from "@/lib/admin/actions";
import { adminConfigured, currentAdmin } from "@/lib/admin/session";
import "./admin.css";

export const metadata = {
  title: "City Hall",
  // A tool, not content. Keep it out of search results entirely.
  robots: { index: false, follow: false },
};

/** Admin pages are per-request: they must show what is in the database right now, never a cache. */
export const dynamic = "force-dynamic";

/**
 * The shell.
 *
 * Two modes:
 *  - Preview (no Supabase env vars): the whole panel is open, no sign-in, showing the site's local
 *    sample content. Every list, form and field works exactly as it will once connected — nothing
 *    is faked or simplified — but Save/Delete say plainly that nothing is stored yet, because there
 *    is genuinely nowhere to store it (see lib/admin/preview.ts). This is for building and trying
 *    the panel before a database exists.
 *  - Live (Supabase configured): the real authorisation check applies. Session is verified against
 *    the `admins` allow-list, and Postgres checks it again through row-level security on every
 *    query, so this is where real editing and real accounts belong.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const preview = !adminConfigured();
  const admin = preview ? null : await currentAdmin();
  if (!preview && !admin) redirect("/admin/login");

  return (
    <div className="ah">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="ah-kicker">JYC Administration</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">City Hall</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Manage worlds, clubs, events, people and the city map.{" "}
              {preview ? "Preview mode: nothing here is saved yet." : "Changes appear on the site immediately."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="ah-btn ah-btn--ghost" prefetch={false}>
              View site
            </Link>
            {!preview && (
              <form action={signOut}>
                <button type="submit" className="ah-btn ah-btn--ghost">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>

        {preview ? (
          <p className="ah-note ah-note--bad mb-4 text-xs">
            No database connected — showing the site&apos;s built-in sample content. Editing works, but nothing you
            change is stored: connect Supabase to make it real. See{" "}
            <code>supabase/schema.sql</code> and <code>supabase/migrations/0001_admin_writes.sql</code>.
          </p>
        ) : (
          <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
            Signed in as {admin!.user.email} · {admin!.user.role}
          </p>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          <Sidebar />
          <main className="ah-panel min-w-0 flex-1 p-5 md:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
