/**
 * The cookie name, alone in its own file.
 *
 * middleware.ts runs on the edge and must not pull in `next/headers` or the Supabase client, which
 * is what importing lib/admin/session.ts would do. Both sides import this instead.
 */
export const ADMIN_COOKIE = "jyc_admin_session";
