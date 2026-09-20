import { adminConfigured, adminDb } from "./session";
import { previewCounts, previewGet, previewList, previewRefOptions } from "./preview";
import { primaryKeyOf, type Resource } from "./resources";

/**
 * Reads for the panel.
 *
 * Two modes:
 *  - Live (Supabase configured): reads the real database, uncached, so an editor sees the true
 *    state the instant they save. Does NOT go through lib/data.ts — that path is cached for five
 *    minutes and falls back to sample content, which is right for visitors and wrong here.
 *  - Preview (no Supabase yet): reads the same local sample content the public site falls back to
 *    (lib/admin/preview.ts), so the screens can be built and tried before a database exists.
 */

export type Row = Record<string, unknown>;

export async function listRows(resource: Resource, scopeValue?: string): Promise<Row[]> {
  if (!adminConfigured()) return previewList(resource, scopeValue);

  const db = await adminDb();
  let q = db.from(resource.table).select("*").order(resource.orderBy.column, {
    ascending: resource.orderBy.ascending ?? true,
  });
  if (resource.scope && scopeValue) q = q.eq(resource.scope.column, scopeValue);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export async function getRow(resource: Resource, id: string): Promise<Row | null> {
  if (!adminConfigured()) return previewGet(resource, id);

  const db = await adminDb();
  const match =
    resource.table === "collaborations"
      ? { domain_a: id.split("~")[0], domain_b: id.split("~")[1] }
      : { [primaryKeyOf(resource)]: id };

  const { data, error } = await db.from(resource.table).select("*").match(match).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Row) ?? null;
}

/** The id used in this row's edit URL. Composite keys are joined with a tilde. */
export function rowId(resource: Resource, row: Row): string {
  if (resource.table === "collaborations") return `${row.domain_a}~${row.domain_b}`;
  return String(row[primaryKeyOf(resource)]);
}

/** Options for every `ref` dropdown, fetched once per page. */
export async function refOptions(): Promise<{
  domains: Array<{ id: string; label: string }>;
  clubs: Array<{ id: string; label: string }>;
}> {
  if (!adminConfigured()) return previewRefOptions();

  const db = await adminDb();
  const [d, c] = await Promise.all([
    db.from("domains").select("id, name").order("sort"),
    db.from("clubs").select("id, name, domain_id").order("domain_id").order("sort"),
  ]);

  return {
    domains: (d.data ?? []).map((r) => ({ id: r.id as string, label: `${r.name} (${r.id})` })),
    clubs: (c.data ?? []).map((r) => ({ id: r.id as string, label: `${r.domain_id} · ${r.name} (${r.id})` })),
  };
}

/** How many rows in each table, for the dashboard. */
export async function counts(tables: readonly string[]): Promise<Record<string, number>> {
  if (!adminConfigured()) return previewCounts(tables);

  const db = await adminDb();
  const entries = await Promise.all(
    tables.map(async (t) => {
      const { count } = await db.from(t).select("*", { count: "exact", head: true });
      return [t, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries);
}
