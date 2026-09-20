/**
 * Outline of a spur gear as one closed SVG path.
 * `r` is the pitch radius, `depth` the tooth height. Deterministic, rounded to 2 decimals.
 */
export function gearPath(cx: number, cy: number, r: number, teeth: number, depth: number): string {
  const step = (Math.PI * 2) / teeth;
  const ro = r + depth / 2;
  const ri = r - depth / 2;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    // Four points per tooth: root start, tip start, tip end, root end.
    const angles: Array<[number, number]> = [
      [a - step * 0.28, ri],
      [a - step * 0.16, ro],
      [a + step * 0.16, ro],
      [a + step * 0.28, ri],
    ];
    for (const [ang, rad] of angles) {
      const x = Math.round((cx + Math.cos(ang) * rad) * 100) / 100;
      const y = Math.round((cy + Math.sin(ang) * rad) * 100) / 100;
      pts.push(`${pts.length === 0 ? "M" : "L"}${x} ${y}`);
    }
  }
  return pts.join("") + "Z";
}
