import type { CSSProperties, ReactNode } from "react"
import { isPlaceholder } from "@/lib/legal.config"

// Gemeinsames Layout für alle Rechtsseiten. Server Component.
export default function LegalLayout({
  title,
  lastUpdated,
  kickerText = "RECHTLICHES",
  standLabel = "Stand",
  children,
}: {
  title: string
  lastUpdated: string
  kickerText?: string
  standLabel?: string
  children: ReactNode
}) {
  return (
    <div style={page}>
      <article style={container}>
        <p style={kicker}>{kickerText}</p>
        <h1 style={h1}>{title}</h1>
        <p style={stand}>{standLabel}: {lastUpdated}</p>
        <div className="legal-prose" style={content}>{children}</div>
      </article>
    </div>
  )
}

// Abschnitt mit Überschrift
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: "2.25rem" }}>
      <h2 style={h2}>{heading}</h2>
      {children}
    </section>
  )
}

// Hebt noch nicht ausgefüllte Platzhalter sichtbar hervor; zeigt sonst den Wert.
export function PH({ value }: { value: string }) {
  if (isPlaceholder(value)) {
    return (
      <mark
        style={{
          background: "#ffe49b",
          color: "#0c0c0c",
          padding: "0 4px",
          borderRadius: 3,
          fontWeight: 600,
        }}
        title="Vor Go-Live in lib/legal.config.ts ausfüllen"
      >
        {value}
      </mark>
    )
  }
  return <>{value}</>
}

// ── Styles ────────────────────────────────────────────────────────────────────

const page: CSSProperties = {
  background: "var(--bg, #e4e2dc)",
  color: "var(--black, #0c0c0c)",
  minHeight: "100vh",
  padding: "clamp(7rem, 12vw, 10rem) clamp(1.25rem, 5vw, 3rem) clamp(4rem, 8vw, 6rem)",
}

const container: CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
}

const kicker: CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
  fontSize: 12,
  letterSpacing: "0.16em",
  color: "var(--ink, #593df8)",
  margin: 0,
}

const h1: CSSProperties = {
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
  fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: "-0.01em",
  margin: "0.5rem 0 0.75rem",
}

const stand: CSSProperties = {
  fontSize: 13,
  color: "rgba(12,12,12,0.55)",
  margin: 0,
}

const content: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "rgba(12,12,12,0.85)",
}

const h2: CSSProperties = {
  fontSize: "clamp(1.15rem, 2.5vw, 1.5rem)",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "var(--black, #0c0c0c)",
  margin: "0 0 0.6rem",
}
