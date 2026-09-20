import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Import it from server code only (lib/data.ts and friends).
 *
 * Env vars (see .env.example):
 *   SUPABASE_URL        or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_ANON_KEY   or NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * The anon key is safe here: row level security allows public reads and nothing else
 * (supabase/schema.sql). Never put a service-role key in this project's env; the site only reads.
 *
 * When either variable is missing, getSupabase() returns null and lib/data.ts serves the local
 * sample content, so `npm run dev` works with no setup.
 */

/** How long Next may reuse a query result. Matches `revalidate` on the routes. */
export const REVALIDATE_SECONDS = 300;

const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = (): boolean => Boolean(url() && key());

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(url(), key(), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        // Route every query through Next's data cache so pages can be static and refresh every 5 minutes.
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } } as RequestInit),
      },
    });
  }
  return client;
}
