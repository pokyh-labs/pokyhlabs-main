"use client"

const SERVICES = [
  { label: "3D Websites", id: "threejs" },
  { label: "Webdesign", id: "frontend" },
  { label: "Webentwicklung", id: "backend" },
  { label: "Hosting", id: "hosting" },
  { label: "WordPress", id: "wordpress" },
  { label: "E-Commerce", id: "ecommerce" },
  { label: "SEO", id: "seo" },
]

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/works", label: "Works" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: "#0c0c0c",
        color: "#e4e2dc",
        padding: "4rem 5vw 2.5rem",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "3rem",
          paddingBottom: "3rem",
          borderBottom: "1px solid rgba(228,226,220,0.12)",
        }}
      >
        {/* Brand column */}
        <div data-reveal>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontStyle: "italic",
                fontSize: 18,
                letterSpacing: "-0.02em",
                color: "#e4e2dc",
                lineHeight: 1,
                display: "flex",
                alignItems: "baseline",
              }}
            >
              <span>pokyh</span>
              <span
                style={{
                  display: "inline-block",
                  width: "0.28em",
                  height: "0.28em",
                  background: "#593DF8",
                  borderRadius: "50%",
                  margin: "0 0.12em 0.08em",
                  transform: "translateY(-0.05em)",
                }}
              />
              <span>studio</span>
            </span>
          </a>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "rgba(228,226,220,0.55)",
              maxWidth: 240,
              margin: "0 0 1.25rem",
            }}
          >
            Digital Studio aus Südtirol. Wir bauen 3D Websites, professionelles Webdesign und
            skalierbare Web-Apps — auf Deutsch, Englisch und Italienisch.
          </p>
          <address
            style={{ fontStyle: "normal", fontSize: 13, color: "rgba(228,226,220,0.45)", lineHeight: 1.8 }}
          >
            Südtirol / Alto Adige, Italy
            <br />
            <a
              href="mailto:hello@pokyh.studio"
              style={{ color: "rgba(228,226,220,0.6)", textDecoration: "none" }}
            >
              hello@pokyh.studio
            </a>
          </address>
        </div>

        {/* Services column */}
        <nav aria-label="Services" data-reveal style={{ "--rd": "100ms" } as React.CSSProperties}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(228,226,220,0.35)",
              marginBottom: "1rem",
            }}
          >
            Services
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {SERVICES.map(({ label, id }) => (
              <li key={id}>
                <a
                  href={`/contact?service=${id}`}
                  style={{ fontSize: 14, color: "rgba(228,226,220,0.65)", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e4e2dc" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(228,226,220,0.65)" }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Navigation column */}
        <nav aria-label="Footer navigation" data-reveal style={{ "--rd": "200ms" } as React.CSSProperties}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(228,226,220,0.35)",
              marginBottom: "1rem",
            }}
          >
            Navigation
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: 14, color: "rgba(228,226,220,0.65)", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e4e2dc" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(228,226,220,0.65)" }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA column */}
        <div data-reveal style={{ "--rd": "300ms" } as React.CSSProperties}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(228,226,220,0.35)",
              marginBottom: "1rem",
            }}
          >
            Projekt starten
          </p>
          <p style={{ fontSize: 13, color: "rgba(228,226,220,0.55)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            Website Hosting ab €20/mo. Antwort innerhalb von 24h.
          </p>
          <a
            href="/contact"
            style={{
              display: "inline-block",
              background: "#593DF8",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4930d4" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#593DF8" }}
          >
            Kontakt aufnehmen
          </a>
          <div style={{ marginTop: "1.5rem" }}>
            <a
              href="https://github.com/pokyhlabs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="pokyh.studio auf GitHub"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "rgba(228,226,220,0.45)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(228,226,220,0.8)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(228,226,220,0.45)" }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: "currentColor" }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        data-reveal
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingTop: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <p style={{ fontSize: 12, color: "rgba(228,226,220,0.3)", margin: 0 }}>
          © {year} pokyh.studio — Digital Studio Südtirol · Alto Adige · South Tyrol
        </p>
        <p style={{ fontSize: 12, color: "rgba(228,226,220,0.25)", margin: 0, letterSpacing: "0.05em" }}>
          DE · EN · IT
        </p>
      </div>
    </footer>
  )
}
