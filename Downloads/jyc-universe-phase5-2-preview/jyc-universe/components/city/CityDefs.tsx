import type { CityTheme } from "@/lib/city";

/**
 * Every gradient the city uses, defined once. Buildings reference them by id
 * (url(#jc-...)), so there are no per-building defs and no filters.
 * The colours come from the city's theme (lib/city.ts), so each world is lit in its own palette.
 */
export default function CityDefs({ theme }: { theme: CityTheme }) {
  const { wall, ground, line } = theme;
  return (
    <defs>
      {/* Walls: lit from the upper left, so the left wall is lighter than the right */}
      <linearGradient id="jc-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={wall.left[0]} />
        <stop offset="1" stopColor={wall.left[1]} />
      </linearGradient>
      <linearGradient id="jc-right" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={wall.right[0]} />
        <stop offset="1" stopColor={wall.right[1]} />
      </linearGradient>
      <linearGradient id="jc-top" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={wall.top[0]} />
        <stop offset="1" stopColor={wall.top[1]} />
      </linearGradient>
      <linearGradient id="jc-roof" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={wall.roof[0]} />
        <stop offset="1" stopColor={wall.roof[1]} />
      </linearGradient>
      <linearGradient id="jc-glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={wall.glass[0]} />
        <stop offset="1" stopColor={wall.glass[1]} />
      </linearGradient>
      <linearGradient id="jc-cyl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={wall.cyl[0]} />
        <stop offset="0.45" stopColor={wall.cyl[1]} />
        <stop offset="1" stopColor={wall.cyl[2]} />
      </linearGradient>

      {/* Ground and island */}
      <linearGradient id="jc-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground.top[0]} />
        <stop offset="1" stopColor={ground.top[1]} />
      </linearGradient>
      <linearGradient id="jc-slab-l" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground.slabL[0]} />
        <stop offset="1" stopColor={ground.slabL[1]} />
      </linearGradient>
      <linearGradient id="jc-slab-r" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground.slabR[0]} />
        <stop offset="1" stopColor={ground.slabR[1]} />
      </linearGradient>
      <linearGradient id="jc-under-l" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground.underL[0]} stopOpacity="1" />
        <stop offset="1" stopColor={ground.underL[1]} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="jc-under-r" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground.underR[0]} stopOpacity="1" />
        <stop offset="1" stopColor={ground.underR[1]} stopOpacity="0" />
      </linearGradient>

      {/* Light */}
      <radialGradient id="jc-plotglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={line} stopOpacity="0.42" />
        <stop offset="1" stopColor={line} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="jc-beam" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={line} stopOpacity="0.5" />
        <stop offset="1" stopColor={line} stopOpacity="0" />
      </linearGradient>

      {/* Stage backdrop: a pool of warm light (used by the Music stage; harmless elsewhere) */}
      <radialGradient id="jc-stage" cx="0.5" cy="0.32" r="0.75">
        <stop offset="0" stopColor={theme.warm} stopOpacity="0.55" />
        <stop offset="0.55" stopColor={line} stopOpacity="0.16" />
        <stop offset="1" stopColor={line} stopOpacity="0.02" />
      </radialGradient>
    </defs>
  );
}
