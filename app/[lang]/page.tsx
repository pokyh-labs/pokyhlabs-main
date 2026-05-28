import type { Metadata } from "next"
import Headline from "@/components/Headline"
import ParticleCanvas from "@/components/ParticleCanvasLazy"
import RailLine from "@/components/RailLine"
import Socials from "@/components/Socials"
import ScrollIndicator from "@/components/ScrollIndicator"
import HomeClientWrapper from "@/components/HomeClientWrapper"
import { siteConfig, hostingSchema } from "@/lib/seo.config"
import type { Lang } from "@/lib/server-api"
import { translations, type Lang as I18nLang, type TranslationKey } from "@/lib/i18n/translations"

function st(lang: string, key: TranslationKey): string {
  const l = lang.toUpperCase() as I18nLang
  return translations[l]?.[key] ?? translations.DE[key]
}

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
  const { lang } = await params

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

      {/* SEO content block — für Suchmaschinen & Screenreader, visuell versteckt */}
      <section
        aria-label={st(lang, "seo_about_label")}
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
          <h2 data-speakable="true">{st(lang, "seo_title")}</h2>
          <p data-speakable="true">{st(lang, "seo_body")}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {([
              ["seo_svc_3d_title",      "seo_svc_3d_desc"],
              ["seo_svc_web_title",     "seo_svc_web_desc"],
              ["seo_svc_hosting_title", "seo_svc_hosting_desc"],
              ["seo_svc_wp_title",      "seo_svc_wp_desc"],
              ["seo_svc_seo_title",     "seo_svc_seo_desc"],
              ["seo_svc_app_title",     "seo_svc_app_desc"],
            ] as [TranslationKey, TranslationKey][]).map(([tk, dk]) => (
              <div key={tk}>
                <h3>{st(lang, tk)}</h3>
                <p>{st(lang, dk)}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <a href={`/${lang}/contact`}>{st(lang, "seo_cta_project")}</a>
            {" "}
            <a href={`/${lang}/works`}>{st(lang, "seo_cta_portfolio")}</a>
          </div>
        </div>
      </section>
    </>
  )
}
