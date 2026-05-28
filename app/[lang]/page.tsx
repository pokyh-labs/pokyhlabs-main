import type { Metadata } from "next"
import Headline from "@/components/Headline"
import ParticleCanvas from "@/components/ParticleCanvasLazy"
import RailLine from "@/components/RailLine"
import Socials from "@/components/Socials"
import ScrollIndicator from "@/components/ScrollIndicator"
import HomeClientWrapper from "@/components/HomeClientWrapper"
import { siteConfig, hostingSchema } from "@/lib/seo.config"
import type { Lang } from "@/lib/server-api"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const l = lang as Lang
  const titleMap: Record<Lang, string> = {
    de: siteConfig.title.default,
    en: siteConfig.title.en,
    it: siteConfig.title.it,
  }
  const descMap: Record<Lang, string> = {
    de: siteConfig.descriptions.de,
    en: siteConfig.descriptions.en,
    it: siteConfig.descriptions.it,
  }
  return {
    title: { absolute: titleMap[l] ?? siteConfig.title.default },
    description: descMap[l] ?? siteConfig.description,
    keywords: siteConfig.keywords,
    alternates: {
      canonical: `${siteConfig.url}/${lang}`,
      languages: {
        de: `${siteConfig.url}/de`,
        en: `${siteConfig.url}/en`,
        it: `${siteConfig.url}/it`,
        "x-default": `${siteConfig.url}/de`,
      },
    },
    openGraph: {
      url: `${siteConfig.url}/${lang}`,
      title: titleMap[l] ?? siteConfig.title.default,
      description: descMap[l] ?? siteConfig.description,
      locale: l === "en" ? "en_US" : l === "it" ? "it_IT" : "de_AT",
      alternateLocale: l === "de" ? ["en_US", "it_IT"] : l === "en" ? ["de_AT", "it_IT"] : ["de_AT", "en_US"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio – Digital Studio Südtirol" }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleMap[l] ?? siteConfig.title.default,
      description: descMap[l] ?? siteConfig.description,
      images: ["/opengraph-image"],
    },
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  await params // consume params (lang validation handled in layout)

  return (
    <>
      {/* Hosting service with explicit €20/mo price — enables price snippets on home page */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hostingSchema) }} />
      <HomeClientWrapper>
        <ParticleCanvas />
        <div className="ui" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          <Headline />
          <RailLine />
          <Socials />
          <ScrollIndicator />
        </div>
      </HomeClientWrapper>

      {/* SEO content block — indexed by crawlers & screen readers; visually hidden from users */}
      <section
        aria-label="Über pokyh.studio"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2
            data-speakable="true"
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#0c0c0c",
              marginBottom: "1.25rem",
            }}
          >
            Digital Studio aus Südtirol: 3D Websites, Webdesign & Hosting
          </h2>
          <p
            data-speakable="true"
            style={{
              fontSize: "clamp(1rem, 1.2vw, 1.1rem)",
              lineHeight: 1.8,
              color: "rgba(12,12,12,0.7)",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              maxWidth: 700,
              marginBottom: "2.5rem",
            }}
          >
            pokyh.studio ist ein Digital Studio aus Südtirol / Alto Adige, gegründet 2024 von zwei
            Entwicklern. Wir bauen 3D Websites, professionelles Webdesign, Frontend- und
            Backend-Entwicklung, WordPress, E-Commerce und bieten verwaltetes Website-Hosting ab{" "}
            <strong>€20/Monat</strong>. Wir arbeiten auf Deutsch, Englisch und Italienisch und
            betreuen Kunden in Deutschland, Österreich, der Schweiz und Italien.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                title: "3D Websites & Three.js",
                desc: "Immersive, interaktive 3D-Erlebnisse direkt im Browser — kein App-Download nötig. Unser Signature-Service.",
              },
              {
                title: "Webdesign & Webentwicklung",
                desc: "Maßgeschneiderte Websites mit React & Next.js — pixelgenau, blitzschnell und skalierbar.",
              },
              {
                title: "Website Hosting ab €20/mo",
                desc: "Vollständig verwaltetes Hosting inkl. SSL, täglichem Backup und Uptime-Monitoring. Fixpreis.",
              },
              {
                title: "WordPress & E-Commerce",
                desc: "WordPress-Websites die du selbst bearbeiten kannst. Online-Shops optimiert für Conversions.",
              },
              {
                title: "SEO & Sichtbarkeit",
                desc: "Suchmaschinenoptimierung für Google und AI-Suchen — mehr Sichtbarkeit, mehr Kunden.",
              },
              {
                title: "React Native & Flutter Apps",
                desc: "Cross-platform Apps für iOS & Android aus einer Codebase — für App Store und Google Play.",
              },
            ].map(({ title, desc }) => (
              <div key={title}>
                <h3
                  style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#0c0c0c",
                    marginBottom: "0.5rem",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    color: "rgba(12,12,12,0.6)",
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <a
              href="/contact"
              style={{
                display: "inline-block",
                background: "#0c0c0c",
                color: "#fff",
                borderRadius: 999,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "0.01em",
                marginRight: 12,
              }}
            >
              Projekt anfragen
            </a>
            <a
              href="/works"
              style={{
                display: "inline-block",
                color: "#0c0c0c",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                letterSpacing: "0.01em",
              }}
            >
              Portfolio ansehen
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
