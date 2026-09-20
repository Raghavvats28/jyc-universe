import { ImageResponse } from "next/og";

/**
 * Share cards, drawn in the universe's own language: near-black field, a faint star grid, one
 * accent glow, big display type. No network fonts (the build may have no egress) and no images,
 * so a card is a few KB of vector-ish output and never fails.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const VOID = "#0b0c0c";
const BONE = "#ece7dc";

/** Deterministic star field: no randomness at render time, so two builds produce the same card. */
function stars(count: number) {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let h = 97;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) % 2147483648;
    const x = (h / 2147483648) * OG_SIZE.width;
    h = (h * 1103515245 + 12345) % 2147483648;
    const y = (h / 2147483648) * OG_SIZE.height;
    h = (h * 1103515245 + 12345) % 2147483648;
    const t = h / 2147483648;
    out.push({ x, y, r: t > 0.9 ? 2.2 : 1.2, o: 0.18 + t * 0.5 });
  }
  return out;
}

const STARS = stars(70);

export function ogScene({
  kicker,
  title,
  sub,
  accent = BONE,
}: {
  /** Small uppercase line above the title: the world, the club, "Event". */
  kicker?: string;
  title: string;
  /** One line under the title: tagline, date · time · place. */
  sub?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          position: "relative",
          background: VOID,
          padding: "72px 80px",
          color: BONE,
          fontFamily: "sans-serif",
        }}
      >
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: s.r * 2,
              background: BONE,
              opacity: s.o,
            }}
          />
        ))}

        {/* The accent glow: the world's colour bleeding in from the upper right, like a planet off frame. */}
        <div
          style={{
            position: "absolute",
            right: -220,
            top: -260,
            width: 760,
            height: 760,
            borderRadius: 760,
            background: `radial-gradient(circle, ${accent}55 0%, ${accent}18 42%, rgba(11,12,12,0) 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 380,
            background: "linear-gradient(to top, rgba(11,12,12,0.96), rgba(11,12,12,0))",
          }}
        />

        {kicker ? (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: accent,
              marginBottom: 20,
            }}
          >
            {kicker}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: title.length > 34 ? 80 : 104,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {sub ? (
          <div style={{ display: "flex", fontSize: 30, color: "rgba(236,231,220,0.66)", marginTop: 26, maxWidth: 980 }}>
            {sub}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 44,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(236,231,220,0.5)",
          }}
        >
          <div style={{ display: "flex", width: 44, height: 2, background: accent }} />
          Jaypee Youth Club
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
