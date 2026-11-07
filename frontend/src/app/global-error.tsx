"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbf9f2", color: "#0b2e24" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center"
          }}
        >
          <div style={{ maxWidth: "32rem" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#a16207" }}>
              Madrasa Miftah ul Uloom
            </p>
            <h1 style={{ margin: "0.75rem 0 0", fontSize: "2rem" }}>The application could not start</h1>
            <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#52645e" }}>
              An unexpected error occurred. Please reload the page. If it persists, contact the madrasa office.
            </p>
            {error.digest ? (
              <p style={{ fontSize: "0.75rem", color: "#52645e" }}>
                Reference: <code>{error.digest}</code>
              </p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                background: "#064e3b",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
