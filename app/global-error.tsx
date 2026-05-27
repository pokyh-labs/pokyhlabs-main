"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          background: "#0c0c0c",
          color: "#e4e2dc",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1rem" }}>
            Etwas ist schiefgelaufen
          </h1>
          <button
            onClick={reset}
            style={{
              background: "#e4e2dc",
              color: "#0c0c0c",
              border: "none",
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  )
}
