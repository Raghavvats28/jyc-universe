"use client";

/**
 * Last resort: the root layout itself failed, so the star field, fonts and providers are all gone.
 * This renders its own <html>/<body> and inlines its styling — it cannot rely on globals.css.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0c0c", color: "#ece7dc", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "34rem" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#8d9096" }}>
              Total blackout
            </p>
            <h1 style={{ fontSize: "clamp(2.5rem,9vw,5rem)", lineHeight: 0.9, letterSpacing: "-0.04em", margin: "1.5rem 0 0" }}>
              The universe
              <br />
              went dark
            </h1>
            <p style={{ color: "rgba(236,231,220,0.6)", marginTop: "2rem" }}>
              Reload to bring it back. If it keeps happening, the site is having a bad day, not you.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "2.5rem",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(236,231,220,0.3)",
                color: "#ece7dc",
                font: "inherit",
                padding: "0 0 0.25rem",
                cursor: "pointer",
              }}
            >
              Reload the universe
            </button>
            {error.digest && (
              <p style={{ marginTop: "2.5rem", fontSize: 11, letterSpacing: "0.22em", color: "#8d9096" }}>
                Reference {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
