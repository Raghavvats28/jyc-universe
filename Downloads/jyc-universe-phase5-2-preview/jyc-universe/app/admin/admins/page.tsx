import DeleteButton from "@/components/admin/DeleteButton";
import Notices from "@/components/admin/Notices";
import AddAdminForm from "./AddAdminForm";
import { removeAdmin } from "@/lib/admin/actions";
import { adminConfigured, adminDb, requireAdmin } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * Who can get in.
 *
 * Adding someone is two steps on purpose: an owner creates the account in Supabase (Authentication →
 * Users) and then pastes its UUID here. The panel deliberately cannot create auth users itself —
 * that would need a service-role key on the app server, and this project does not have one anywhere.
 */
export default async function AdminsPage({
  searchParams,
}: {
  searchParams: { deleted?: string; preview?: string; error?: string };
}) {
  if (!adminConfigured()) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Administrators</h2>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
          There is nowhere to store an admin list yet — this needs a database. Connect Supabase (see the banner
          above) and this screen becomes real: create a login, paste its ID, and manage who can edit the site.
        </p>
      </div>
    );
  }

  const { user } = await requireAdmin();
  const db = await adminDb();
  const { data } = await db.from("admins").select("user_id, email, role, created_at").order("created_at");
  const admins = data ?? [];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Administrators</h2>
      <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
        Anyone on this list can edit the site. Owners can also add and remove people here.
      </p>

      <Notices deleted={searchParams.deleted} preview={searchParams.preview} error={searchParams.error} />

      <ul className="mt-6 space-y-2">
        {admins.map((a) => (
          <li key={a.user_id as string} className="ah-row flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{a.email as string}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: "var(--muted)" }}>
                {a.role as string}
                {a.user_id === user.user_id ? " · you" : ""}
              </p>
            </div>
            {user.role === "owner" && a.user_id !== user.user_id && (
              <DeleteButton
                action={removeAdmin.bind(null, a.user_id as string)}
                warning={`Remove ${a.email}? They lose access on their next request.`}
                label="Remove"
              />
            )}
          </li>
        ))}
      </ul>

      {user.role === "owner" ? (
        <div className="ah-panel mt-8 p-5">
          <h3 className="font-semibold">Add an administrator</h3>
          <ol className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
            <li>1. In Supabase: Authentication → Users → Add user (email, password, auto-confirm).</li>
            <li>2. Copy that user&apos;s UUID and paste it below.</li>
          </ol>
          <div className="mt-5">
            <AddAdminForm />
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
          Ask an owner to add or remove people.
        </p>
      )}
    </div>
  );
}
