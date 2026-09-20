import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteRecord } from "@/lib/admin/actions";
import { resourceOf } from "@/lib/admin/resources";
import { listRows, refOptions, rowId } from "@/lib/admin/query";
import Notices from "@/components/admin/Notices";
import ScopeFilter from "@/components/admin/ScopeFilter";

export const dynamic = "force-dynamic";

/** One list screen for every table, built from the resource definition. */
export default async function ResourceList({
  params,
  searchParams,
}: {
  params: { resource: string };
  searchParams: { scope?: string; saved?: string; deleted?: string; preview?: string; error?: string };
}) {
  const resource = resourceOf(params.resource);
  if (!resource) notFound();

  const scope = searchParams.scope || undefined;
  const [rows, refs] = await Promise.all([listRows(resource, scope), resource.scope ? refOptions() : Promise.resolve(null)]);

  const cascades = resource.table === "domains" || resource.table === "clubs";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{resource.many}</h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
            {resource.blurb}
          </p>
        </div>
        <Link href={`/admin/${resource.key}/new`} className="ah-btn">
          + Add
        </Link>
      </div>

      <Notices saved={searchParams.saved} deleted={searchParams.deleted} preview={searchParams.preview} error={searchParams.error} />

      {resource.scope && refs && (
        <ScopeFilter
          label={resource.scope.label}
          value={scope ?? ""}
          options={resource.scope.resource === "domains" ? refs.domains : refs.clubs}
          resourceKey={resource.key}
        />
      )}

      <ul className="mt-6 space-y-2">
        {rows.length === 0 && (
          <li className="text-sm" style={{ color: "var(--muted)" }}>
            Nothing here yet. Use Add to create the first one.
          </li>
        )}

        {rows.map((row) => {
          const id = rowId(resource, row);
          const subtitle = (resource.subtitleColumns ?? [])
            .map((c) => row[c])
            .filter((v) => v !== null && v !== undefined && v !== "")
            .join(" · ");

          return (
            <li key={id} className="ah-row flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{String(row[resource.titleColumn] || id)}</p>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--muted)" }}>
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/admin/${resource.key}/${encodeURIComponent(id)}`} className="ah-btn ah-btn--ghost">
                  Edit
                </Link>
                <DeleteButton
                  action={deleteRecord.bind(null, resource.key, id)}
                  warning={
                    cascades
                      ? `Delete "${String(row[resource.titleColumn] || id)}"? Everything inside it — clubs, events, photos, buildings — is deleted too. This cannot be undone.`
                      : `Delete "${String(row[resource.titleColumn] || id)}"? This cannot be undone.`
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
