import Link from "next/link";
import { notFound } from "next/navigation";
import RecordForm from "@/components/admin/Form";
import { updateRecord } from "@/lib/admin/actions";
import { getRow, refOptions } from "@/lib/admin/query";
import { primaryKeyOf, resourceOf } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

export default async function EditRecord({ params }: { params: { resource: string; id: string } }) {
  const resource = resourceOf(params.resource);
  if (!resource) notFound();

  const id = decodeURIComponent(params.id);
  const [row, refs] = await Promise.all([getRow(resource, id), refOptions()]);
  if (!row) notFound();

  // The primary key is shown but not editable: it is baked into public URLs, share cards and
  // anything anyone has already linked to.
  const locked = resource.table === "collaborations" ? ["domain_a", "domain_b"] : [primaryKeyOf(resource)];

  return (
    <div>
      <Link href={`/admin/${resource.key}`} className="text-xs" style={{ color: "var(--muted)" }}>
        ← {resource.many}
      </Link>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        {String(row[resource.titleColumn] || id)}
      </h2>

      <div className="mt-7">
        <RecordForm
          action={updateRecord.bind(null, resource.key, id)}
          fields={resource.fields}
          record={row}
          submitLabel="Save changes"
          cancelHref={`/admin/${resource.key}`}
          lockedFields={locked}
          refs={refs}
        />
      </div>
    </div>
  );
}
