"use client";

import type { UniverseView } from "./UniverseMap";

const OPTIONS: Array<{ id: UniverseView; label: string; hint: string }> = [
  { id: "2d", label: "2D", hint: "Flat map" },
  { id: "3d", label: "3D", hint: "Tilted, in space" },
];

/** Switches the universe map between the flat view and the tilted 3D view. */
export default function ViewToggle({
  view,
  onChange,
  className = "",
}: {
  view: UniverseView;
  onChange: (view: UniverseView) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Map view" className={`inline-flex border border-line ${className}`}>
      {OPTIONS.map((o) => {
        const on = view === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            aria-label={`${o.label} view. ${o.hint}`}
            onClick={() => onChange(o.id)}
            className={`min-h-11 min-w-14 px-4 text-[11px] font-medium tracking-[0.24em] transition-colors ${
              on ? "bg-bone/10 text-bone" : "text-bone/50 hover:text-bone"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
