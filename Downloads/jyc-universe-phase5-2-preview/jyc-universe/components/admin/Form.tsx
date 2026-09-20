"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import type { Field } from "@/lib/admin/resources";
import type { ActionResult } from "@/lib/admin/actions";

/**
 * The form every section uses, built from the field list in lib/admin/resources.ts.
 *
 * It is a real <form> posting to a Server Action: it works before React has hydrated, the browser
 * does the first pass of validation, and there is no client-side state to get out of sync with the
 * database. The only client code here is the pending state on the button and the error banner.
 */

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ah-btn" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function Input({ field, value, refOptions }: { field: Field; value: unknown; refOptions?: Array<{ id: string; label: string }> }) {
  const common = { id: field.name, name: field.name, className: "ah-input", required: field.required };
  const asString = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const initial = asString !== "" ? asString : field.initial !== undefined ? String(field.initial) : "";

  switch (field.type) {
    case "textarea":
    case "json":
      return <textarea {...common} defaultValue={initial} placeholder={field.placeholder} />;
    case "number":
      return <input {...common} type="number" step="any" defaultValue={initial} />;
    case "date":
      return <input {...common} type="date" defaultValue={initial} />;
    case "colour":
      return (
        <div className="flex gap-2">
          <input {...common} type="color" defaultValue={initial || "#5fd4c4"} className="ah-input w-16" />
          {/* The hex is editable by hand too: pasting a brand colour is faster than a colour wheel. */}
          <input
            type="text"
            defaultValue={initial || "#5fd4c4"}
            className="ah-input"
            aria-label={`${field.label} hex value`}
            onChange={(e) => {
              const picker = document.getElementById(field.name) as HTMLInputElement | null;
              if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) picker.value = e.target.value;
            }}
          />
        </div>
      );
    case "checkbox":
      return (
        <input
          id={field.name}
          name={field.name}
          type="checkbox"
          defaultChecked={value === true || (value === undefined && field.initial === true)}
          className="h-5 w-5 accent-[var(--amber)]"
        />
      );
    case "select":
      return (
        <select {...common} defaultValue={initial}>
          {!field.required && <option value="">—</option>}
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "ref":
      return (
        <select {...common} defaultValue={initial}>
          <option value="">— choose —</option>
          {refOptions?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      );
    default:
      return <input {...common} type="text" defaultValue={initial} placeholder={field.placeholder} />;
  }
}

export default function RecordForm({
  action,
  fields,
  record,
  submitLabel,
  cancelHref,
  lockedFields = [],
  refs = {},
}: {
  action: (prev: ActionResult | null, data: FormData) => Promise<ActionResult>;
  fields: readonly Field[];
  record?: Record<string, unknown>;
  submitLabel: string;
  cancelHref: string;
  /** Names shown read-only (a primary key on an existing row: changing it would break live URLs). */
  lockedFields?: readonly string[];
  refs?: Record<string, Array<{ id: string; label: string }>>;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok && (
        <p role="alert" className="ah-note ah-note--bad">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f) => {
          const locked = lockedFields.includes(f.name);
          return (
            <div key={f.name} className={`ah-field ${f.wide ? "md:col-span-2" : ""}`}>
              <label htmlFor={f.name}>
                {f.label}
                {f.required && <span aria-hidden className="ml-1 text-[var(--amber)]">*</span>}
              </label>

              {locked ? (
                <>
                  <input className="ah-input opacity-60" value={String(record?.[f.name] ?? "")} readOnly aria-readonly />
                  <p className="ah-help">
                    Fixed once created — this is part of a public web address. To change it, create a new record and
                    delete this one.
                  </p>
                </>
              ) : (
                <>
                  <Input field={f} value={record?.[f.name]} refOptions={f.refResource ? refs[f.refResource] : undefined} />
                  {f.help && <p className="ah-help">{f.help}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Submit label={submitLabel} />
        <Link href={cancelHref} className="ah-btn ah-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
