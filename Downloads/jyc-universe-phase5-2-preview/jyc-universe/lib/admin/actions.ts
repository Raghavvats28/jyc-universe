"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfigured, adminDb, authClient, clearSession, requireAdmin, writeSession, type AdminSession } from "./session";
import { primaryKeyOf, resourceOf, type Field, type Resource } from "./resources";

/**
 * Every write the panel can make.
 *
 * All of them are Server Actions, so nothing is exposed as a public API route: the only way to
 * reach them is a form submitted from a page the session already guards, and the database checks
 * the same session again through RLS. A missing or revoked admin fails in both places.
 *
 * After a successful write the whole site is revalidated (`revalidatePath('/', 'layout')`). The
 * routes are static with `revalidate = 300`, so without this an editor would save a change and
 * then not see it for five minutes and assume the panel is broken.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

function refreshSite(): void {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ auth */

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!adminConfigured()) return { ok: false, error: "No database connected yet — there is nothing to sign into." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    // Deliberately vague: do not tell a stranger whether the address exists.
    return { ok: false, error: "That email and password do not match." };
  }

  const session: AdminSession = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    user_id: data.user.id,
    email: data.user.email ?? email,
  };
  writeSession(session);

  // Signed in, but are they on the allow-list? If not, drop the session again.
  try {
    await requireAdmin();
  } catch {
    clearSession();
    return { ok: false, error: "This account is not an administrator." };
  }

  redirect("/admin");
}

export async function signOut(): Promise<void> {
  clearSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ field parsing */

/** Turn one form value into what the column expects, or throw a message an editor can act on. */
function parseField(f: Field, raw: FormDataEntryValue | null): unknown {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (f.type === "checkbox") return raw !== null;

  if (!value) {
    if (f.required) throw new Error(`${f.label} is required.`);
    // An empty optional field is a null, not an empty string: the column may be nullable on purpose.
    return f.type === "number" ? null : f.type === "json" ? [] : null;
  }

  switch (f.type) {
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error(`${f.label} must be a number.`);
      return n;
    }
    case "slug": {
      if (!/^[a-z0-9-]+$/.test(value)) {
        throw new Error(`${f.label} may only contain lowercase letters, numbers and hyphens.`);
      }
      return value;
    }
    case "colour": {
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`${f.label} must be a six-digit hex colour, like #5fd4c4.`);
      return value;
    }
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${f.label} must be a date.`);
      return value;
    }
    case "json": {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        return parsed;
      } catch {
        throw new Error(`${f.label} must be a JSON array, for example [[10, -20], [30, 15]].`);
      }
    }
    case "select": {
      if (f.options && !f.options.includes(value)) throw new Error(`${f.label} must be one of: ${f.options.join(", ")}.`);
      return value;
    }
    default:
      return value;
  }
}

function rowFrom(resource: Resource, formData: FormData, { skipId = false } = {}): Record<string, unknown> {
  const pk = primaryKeyOf(resource);
  const row: Record<string, unknown> = {};
  for (const f of resource.fields) {
    // The primary key of an existing row is never rewritten: changing a slug would break every
    // link that already points at it. Delete and recreate instead, deliberately.
    if (skipId && f.name === pk) continue;
    row[f.name] = parseField(f, formData.get(f.name));
  }
  return row;
}

/** Composite keys (collaborations) are encoded in the URL as `a~b`. */
function matchFor(resource: Resource, id: string): Record<string, string> {
  if (resource.table === "collaborations") {
    const [a, b] = id.split("~");
    return { domain_a: a, domain_b: b };
  }
  return { [primaryKeyOf(resource)]: id };
}

/** Supabase errors are precise but unfriendly; translate the three an editor will actually hit. */
function readableError(message: string): string {
  if (/duplicate key|already exists/i.test(message)) return "Something with that slug already exists. Pick another.";
  if (/violates foreign key/i.test(message)) return "That world or club does not exist. Create it first.";
  if (/row-level security|permission denied/i.test(message)) {
    return "The database refused the change. Your account may no longer be an administrator.";
  }
  return message;
}

/* ------------------------------------------------------------------ create / update / delete */

export async function createRecord(
  resourceKey: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const resource = resourceOf(resourceKey);
  if (!resource) return { ok: false, error: "Unknown section." };

  // Preview mode has nowhere to write to. Validate the form anyway (so it behaves correctly once a
  // database exists) and then say plainly that nothing was saved, rather than silently doing nothing.
  try {
    rowFrom(resource, formData);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!adminConfigured()) redirect(`/admin/${resource.key}?preview=1`);

  const row = rowFrom(resource, formData);
  const db = await adminDb();
  const { error } = await db.from(resource.table).insert(row);
  if (error) return { ok: false, error: readableError(error.message) };

  refreshSite();
  redirect(`/admin/${resource.key}?saved=1`);
}

export async function updateRecord(
  resourceKey: string,
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const resource = resourceOf(resourceKey);
  if (!resource) return { ok: false, error: "Unknown section." };

  try {
    rowFrom(resource, formData, { skipId: true });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!adminConfigured()) redirect(`/admin/${resource.key}?preview=1`);

  const row = rowFrom(resource, formData, { skipId: true });
  const db = await adminDb();
  const { error } = await db.from(resource.table).update(row).match(matchFor(resource, id));
  if (error) return { ok: false, error: readableError(error.message) };

  refreshSite();
  redirect(`/admin/${resource.key}?saved=1`);
}

/**
 * Deleting a world or a club cascades in the database (schema.sql) to its clubs, events, photos and
 * buildings. The confirmation in the UI says so; this is the only destructive action in the panel.
 */
export async function deleteRecord(resourceKey: string, id: string): Promise<void> {
  const resource = resourceOf(resourceKey);
  if (!resource) redirect("/admin");

  if (!adminConfigured()) redirect(`/admin/${resource.key}?preview=1`);

  const db = await adminDb();
  const { error } = await db.from(resource.table).delete().match(matchFor(resource, id));
  if (error) redirect(`/admin/${resource.key}?error=${encodeURIComponent(readableError(error.message))}`);

  refreshSite();
  redirect(`/admin/${resource.key}?deleted=1`);
}

/* ------------------------------------------------------------------ admins */

export async function addAdmin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!adminConfigured()) return { ok: false, error: "Connect a database first — there is nowhere to store administrators yet." };
  const { user } = await requireAdmin();
  if (user.role !== "owner") return { ok: false, error: "Only an owner can add administrators." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, error: "Paste the user's UUID from Authentication → Users." };
  if (!email) return { ok: false, error: "Email is required." };

  const db = await adminDb();
  const { error } = await db.from("admins").insert({ user_id: userId, email, role });
  if (error) return { ok: false, error: readableError(error.message) };

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function removeAdmin(userId: string): Promise<void> {
  if (!adminConfigured()) redirect("/admin/admins?preview=1");
  const { user } = await requireAdmin();
  const fail = (m: string) => redirect(`/admin/admins?error=${encodeURIComponent(m)}`);
  if (user.role !== "owner") fail("Only an owner can remove administrators.");
  if (user.user_id === userId) fail("You cannot remove your own access.");

  const db = await adminDb();
  const { error } = await db.from("admins").delete().eq("user_id", userId);
  if (error) fail(readableError(error.message));

  revalidatePath("/admin/admins");
  redirect("/admin/admins?deleted=1");
}
