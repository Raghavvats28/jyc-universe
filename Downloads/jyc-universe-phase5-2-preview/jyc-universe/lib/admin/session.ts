import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin auth, built on `@supabase/supabase-js` alone (no new libraries).
 *
 * How it works:
 *   - Sign in exchanges email + password for a Supabase session.
 *   - The session (access + refresh token) is kept in ONE httpOnly, sameSite=lax cookie. It is never
 *     readable by client JS, so there is nothing for a script on the page to steal.
 *   - Every admin query goes through a client that sends that access token as a Bearer header, so
 *     Postgres sees a real `auth.uid()` and the RLS policies in supabase/migrations/0001 apply.
 *     The panel therefore has exactly the rights the database gives it, no more.
 *   - Being signed in is not enough: `requireAdmin()` also checks the `admins` allow-list.
 *
 * The anon key is the only key in this project. There is no service-role key anywhere, so even a
 * total compromise of the app server cannot bypass row level security.
 */

// The name lives in its own module so the edge middleware can read it without importing this file.
export { ADMIN_COOKIE } from "./cookie";
import { ADMIN_COOKIE } from "./cookie";

export type AdminSession = {
  access_token: string;
  refresh_token: string;
  /** Unix seconds. */
  expires_at: number;
  user_id: string;
  email: string;
};

export type AdminUser = { user_id: string; email: string; role: "owner" | "editor" };

const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export { adminConfigured } from "./configured";

/** A plain client with no user attached: used for sign-in and token refresh only. */
export function authClient(): SupabaseClient {
  return createClient(url(), key(), { auth: { persistSession: false, autoRefreshToken: false } });
}

/** A client acting AS the signed-in admin. Every write in the panel goes through one of these. */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(url(), key(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      // The panel must never serve stale rows: an editor has to see the row they just saved.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" } as RequestInit),
    },
  });
}

export function readSession(): AdminSession | null {
  const raw = cookies().get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as AdminSession;
    return s.access_token && s.refresh_token ? s : null;
  } catch {
    return null;
  }
}

/** Only callable from a Server Action or route handler (Next forbids setting cookies while rendering). */
export function writeSession(s: AdminSession): void {
  cookies().set(ADMIN_COOKIE, JSON.stringify(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession(): void {
  cookies().delete(ADMIN_COOKIE);
}

/**
 * The current session, refreshed if the access token has expired.
 *
 * Refreshing writes a new cookie, which Next only allows inside an action. When this is called
 * while rendering a page, the write is skipped and the fresh token is used for that request only —
 * the next action re-persists it. That is why the catch below is empty rather than an error.
 */
export async function currentSession(): Promise<AdminSession | null> {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - 60 > Math.floor(Date.now() / 1000)) return s;

  const { data, error } = await authClient().auth.refreshSession({ refresh_token: s.refresh_token });
  if (error || !data.session || !data.user) return null;

  const next: AdminSession = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    user_id: data.user.id,
    email: data.user.email ?? s.email,
  };
  try {
    writeSession(next);
  } catch {
    /* rendering, not an action: this request uses the token in memory */
  }
  return next;
}

/**
 * The signed-in admin, or null. Checks the allow-list, not just the session, so revoking someone
 * is a single DELETE in the `admins` table and takes effect on their next request.
 */
export async function currentAdmin(): Promise<{ session: AdminSession; user: AdminUser } | null> {
  const session = await currentSession();
  if (!session) return null;

  const { data, error } = await userClient(session.access_token)
    .from("admins")
    .select("user_id, email, role")
    .eq("user_id", session.user_id)
    .maybeSingle();

  if (error || !data) return null;
  return { session, user: data as AdminUser };
}

/** Use in every admin page and action. Throws rather than returning a half-authorised state. */
export async function requireAdmin(): Promise<{ session: AdminSession; user: AdminUser }> {
  const admin = await currentAdmin();
  if (!admin) throw new Error("NOT_AUTHORISED");
  return admin;
}

/** The admin's database client. */
export async function adminDb(): Promise<SupabaseClient> {
  const { session } = await requireAdmin();
  return userClient(session.access_token);
}
