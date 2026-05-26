"use client"

import type { CSSProperties } from "react"

const PURPLE = "#593df8"
const BEIGE = "#e4e2dc"

// Stacked headline words on the left — each links to a real service deep-link
const CATEGORIES = [
  { label: "3D", href: "/contact?service=threejs" },
  { label: "Web", href: "/contact?service=frontend" },
  { label: "Shop", href: "/contact?service=ecommerce" },
  { label: "Hosting", href: "/contact?service=hosting" },
]

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Studio",
    links: [
      { label: "About", href: "/#about" },
      { label: "Works", href: "/works" },
      { label: "Blog", href: "/blog" },
      { label: "Kontakt", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "3D Websites", href: "/contact?service=threejs" },
      { label: "Webdesign", href: "/contact?service=frontend" },
      { label: "Webentwicklung", href: "/contact?service=backend" },
      { label: "SEO", href: "/contact?service=seo" },
    ],
  },
  {
    title: "Mehr",
    links: [
      { label: "Hosting", href: "/contact?service=hosting" },
      { label: "WordPress", href: "/contact?service=wordpress" },
      { label: "E-Commerce", href: "/contact?service=ecommerce" },
    ],
  },
]

const LEGAL = [
  { label: "Media Inquiries", href: "mailto:hello@pokyh.studio" },
  { label: "Discord", href: "https://discord.gg/ffhK8ztv9C", external: true },
  { label: "GitHub", href: "https://github.com/pokyh-labs", external: true },
  { label: "Kontakt", href: "/contact" },
]

// Subtle black speckle grain, encoded as an SVG data URI and laid over the purple.
// Higher alpha bias = fewer specks (only the brightest noise pixels survive).
const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch' result='t'/><feColorMatrix in='t' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -4'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
const grain = `url("data:image/svg+xml,${encodeURIComponent(grainSvg)}")`

function hoverIn(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.opacity = "1"
}
function hoverOut(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.opacity = "0.72"
}

const ext = (external?: boolean) =>
  external ? { target: "_blank", rel: "noopener noreferrer" } : {}

export default function Footer() {
  const colHeading: CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: BEIGE,
    margin: "0 0 1.1rem",
  }
  const colLink: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: BEIGE,
    opacity: 0.72,
    textDecoration: "none",
    transition: "opacity .2s ease",
  }

  return (
    <footer
      className="ft-root"
      data-theme="brand"
      style={{
        background: PURPLE,
        backgroundImage: grain,
        backgroundSize: "220px 220px",
        color: BEIGE,
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Top grid: stacked categories + link columns */}
      <div className="ft-top">
        {/* Stacked category words */}
        <nav aria-label="Leistungen" data-reveal style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {CATEGORIES.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: BEIGE,
                textDecoration: "none",
                opacity: 0.95,
                transition: "opacity .2s ease, transform .2s ease",
                width: "fit-content",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.6"
                e.currentTarget.style.transform = "translateX(4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.95"
                e.currentTarget.style.transform = ""
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Link columns */}
        <div className="ft-cols">
          {COLUMNS.map(({ title, links }, i) => (
            <nav
              key={title}
              aria-label={title}
              data-reveal
              style={{ "--rd": `${(i + 1) * 90}ms` } as CSSProperties}
            >
              <h2 style={colHeading}>{title}</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    <a href={href} {...ext(external)} style={colLink} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Socials + legal row — aligned under the link columns */}
      <div data-reveal className="ft-bottom">
        <div /> {/* empty left cell — mirrors the categories column */}
        <div className="ft-bottom-inner">
          <div style={{ display: "flex", gap: 12 }}>
            <SocialIcon href="https://github.com/pokyh-labs" label="GitHub">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.91.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </SocialIcon>
            <SocialIcon href="https://discord.gg/ffhK8ztv9C" label="Discord">
              <path d="M19.27 5.33A17.4 17.4 0 0 0 15.05 4l-.21.43a16.1 16.1 0 0 0-5.68 0L8.95 4a17.4 17.4 0 0 0-4.22 1.33C2 9.46 1.26 13.5 1.63 17.47a17.6 17.6 0 0 0 5.37 2.7l1.08-1.5a11.3 11.3 0 0 1-1.72-.83l.42-.33a12.5 12.5 0 0 0 10.44 0l.42.33a11.3 11.3 0 0 1-1.72.83l1.08 1.5a17.6 17.6 0 0 0 5.37-2.7c.43-4.6-.7-8.6-3.1-12.14zM8.52 14.9c-1.06 0-1.93-.99-1.93-2.2 0-1.22.85-2.2 1.93-2.2 1.08 0 1.95.99 1.93 2.2 0 1.21-.85 2.2-1.93 2.2zm6.96 0c-1.06 0-1.93-.99-1.93-2.2 0-1.22.85-2.2 1.93-2.2s1.95.99 1.93 2.2c0 1.21-.85 2.2-1.93 2.2z" />
            </SocialIcon>
            <SocialIcon href="mailto:hello@pokyh.studio" label="Email" stroke>
              <rect x="3" y="5" width="18" height="14" rx="1.5" />
              <path d="M3.5 6.5l8.5 6 8.5-6" />
            </SocialIcon>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem 1.75rem" }}>
            {LEGAL.map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                {...ext(external)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: BEIGE,
                  opacity: 0.72,
                  textDecoration: "none",
                  transition: "opacity .2s ease",
                }}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Giant brand wordmark — bottom-left corner, reveals like other footer elements */}
      <a
        href="/"
        aria-label="pokyh.studio home"
        className="ft-wordmark-link"
        data-reveal
        style={{ "--rd": "200ms" } as CSSProperties}
      >
        <div aria-hidden="true" className="ft-wordmark">
          POKYH
        </div>
      </a>
    </footer>
  )
}

function SocialIcon({
  href,
  label,
  stroke,
  children,
}: {
  href: string
  label: string
  stroke?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 38,
        height: 38,
        display: "grid",
        placeItems: "center",
        borderRadius: 8,
        border: `1px solid ${BEIGE}`,
        color: BEIGE,
        opacity: 0.72,
        textDecoration: "none",
        transition: "opacity .2s ease, transform .2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1"
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.72"
        e.currentTarget.style.transform = ""
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={
          stroke
            ? { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }
            : { width: 18, height: 18, fill: "currentColor" }
        }
      >
        {children}
      </svg>
    </a>
  )
}
