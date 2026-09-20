"use client";

import { useRouter } from "next/navigation";

/**
 * "Show only this club's photos". A long unfiltered list of gallery rows or coordinators is
 * unusable once there are more than a few clubs, so scoped resources get this.
 */
export default function ScopeFilter({
  label,
  value,
  options,
  resourceKey,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  resourceKey: string;
}) {
  const router = useRouter();

  return (
    <div className="ah-field mt-6 max-w-sm">
      <label htmlFor="scope">Filter by {label.toLowerCase()}</label>
      <select
        id="scope"
        className="ah-input"
        defaultValue={value}
        onChange={(e) => {
          const v = e.target.value;
          router.push(v ? `/admin/${resourceKey}?scope=${encodeURIComponent(v)}` : `/admin/${resourceKey}`);
        }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
