/**
 * Whether a real database is wired up. Deliberately has no imports (no `next/headers`, no Supabase
 * client) so both the edge middleware and the server-only session code can check it the same way.
 */
export function adminConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(url && key);
}
