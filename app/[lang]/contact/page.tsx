import type { Metadata } from "next"
import { siteConfig, faqSchema, breadcrumbSchema, hostingSchema } from "@/lib/seo.config"
import ContactPage from "@/components/ContactPage"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Projekt anfragen – Webdesign & Hosting",
    description:
      "Projekt starten mit pokyh.studio. Webdesign, 3D, App oder Hosting ab €20/mo (Node.js, Next.js, React, WordPress, Docker). Angebot innerhalb 24 Stunden.",
    keywords: [
      "website anfragen",
      "webdesign anfrage",
      "projekt starten",
      "web agentur kontakt",
      "hosting anfragen",
      "hire web designer",
      "start web project",
      "web design quote",
      "contattare agenzia web",
      "preventivo sito web",
      "pokyh.studio kontakt",
      "pokyh studio contact",
      "pokyh studio contatto",
    ],
    alternates: {
      canonical: `${siteConfig.url}/${lang}/contact`,
      languages: {
        de: `${siteConfig.url}/de/contact`,
        en: `${siteConfig.url}/en/contact`,
        it: `${siteConfig.url}/it/contact`,
        "x-default": `${siteConfig.url}/de/contact`,
      },
    },
    openGraph: {
      url: `${siteConfig.url}/${lang}/contact`,
      title: "Projekt anfragen – Webdesign & Hosting | pokyh.studio",
      description:
        "Webdesign, 3D, App & Managed Hosting ab €20/mo. Website + Hosting zusammen: 5% Rabatt auf Entwicklung. Angebot in 24h.",
      locale: lang === "en" ? "en_US" : lang === "it" ? "it_IT" : "de_AT",
      alternateLocale: lang === "de" ? ["en_US", "it_IT"] : lang === "en" ? ["de_AT", "it_IT"] : ["de_AT", "en_US"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio – Projekt anfragen" }],
    },
  }
}

export default async function Contact({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return (
    <>
      {/* FAQ rich results — shows Q&A directly in Google SERPs */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {/* Hosting Service with explicit €20/mo price — enables price snippets */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hostingSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: `${siteConfig.url}/${lang}` },
              { name: "Kontakt", url: `${siteConfig.url}/${lang}/contact` },
            ])
          ),
        }}
      />
      <ContactPage />
    </>
  )
}
