import Link from "next/link";
import { notFound } from "next/navigation";
import RecordForm from "@/components/admin/Form";
import { createRecord } from "@/lib/admin/actions";
import { refOptions } from "@/lib/admin/query";
import { resourceOf } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

export default async function NewRecord({ params }: { params: { resource: string } }) {
  const resource = resourceOf(params.resource);
  if (!resource) notFound();

  const refs = await refOptions();

  return (
    <div>
      <Link href={`/admin/${resource.key}`} className="text-xs" style={{ color: "var(--muted)" }}>
        ← {resource.many}
      </Link>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">New {resource.one.toLowerCase()}</h2>
      <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
        {resource.blurb}
      </p>

      <div className="mt-7">
        <RecordForm
          action={createRecord.bind(null, resource.key)}
          fields={resource.fields}
          submitLabel={`Create ${resource.one.toLowerCase()}`}
          cancelHref={`/admin/${resource.key}`}
          refs={refs}
        />
      </div>
    </div>
  );
}
