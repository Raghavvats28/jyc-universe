import type { Domain } from "@/lib/types";

/** Small static drawing of a domain's constellation (used in the mobile universe). */
export default function MiniConstellation({ domain, size = 72 }: { domain: Domain; size?: number }) {
  return (
    <svg
      viewBox="-100 -80 200 160"
      width={size}
      height={(size * 160) / 200}
      aria-hidden
      className="shrink-0"
    >
      {domain.links.map(([a, b], i) => (
        <line
          key={i}
          x1={domain.stars[a][0]}
          y1={domain.stars[a][1]}
          x2={domain.stars[b][0]}
          y2={domain.stars[b][1]}
          stroke={domain.accent}
          strokeOpacity={0.5}
          strokeWidth={3}
        />
      ))}
      {domain.stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} fill={domain.accent} />
      ))}
    </svg>
  );
}
