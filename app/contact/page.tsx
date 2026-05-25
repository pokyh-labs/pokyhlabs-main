import type { Metadata } from "next"
import { siteConfig, faqSchema, breadcrumbSchema, hostingSchema } from "@/lib/seo.config"
import ContactPage from "@/components/ContactPage"

export const metadata: Metadata = {
  // Title with template: "Projekt anfragen – Webdesign & Hosting | pokyh.studio" = 54 chars ✓
  title: "Projekt anfragen – Webdesign & Hosting",
  description:
    "Projekt starten mit pokyh.studio. Webdesign, 3D, App oder Hosting ab €20/mo (Node.js, Next.js, React, WordPress, Docker). Angebot innerhalb 24 Stunden.",
  keywords: [
    // DE — General
    "website anfragen",
    "webdesign anfrage",
    "projekt starten",
    "webseite beauftragen",
    "web agentur kontakt",
    "website angebot",
    "webdesign kosten",
    "webentwicklung beauftragen",
    "website kaufen kontakt",
    // DE — Hosting inquiries
    "hosting anfragen",
    "website hosting beauftragen",
    "nodejs hosting anfragen",
    "nextjs hosting beauftragen",
    "react app hosten lassen",
    "wordpress hosting anfragen",
    "docker hosting beauftragen",
    "php hosting anfragen",
    "python hosting beauftragen",
    "managed hosting anfragen",
    "app hosten lassen",
    "website mieten anfragen",
    "5% rabatt website hosting",
    "kombipaket website hosting",
    // DE — Tech
    "wordpress beauftragen",
    "e-commerce beauftragen",
    "nextjs entwicklung anfragen",
    "react entwicklung anfragen",
    // EN — General
    "hire web designer",
    "start web project",
    "web design quote",
    "contact web agency",
    "get website quote",
    "hire web developer",
    "web development inquiry",
    // EN — Hosting inquiries
    "hire web hosting",
    "get hosting quote",
    "nodejs hosting inquiry",
    "nextjs hosting quote",
    "react hosting inquiry",
    "wordpress hosting inquiry",
    "docker hosting quote",
    "managed hosting inquiry",
    "bundle website hosting discount",
    // EN — Tech
    "wordpress development inquiry",
    "e-commerce development quote",
    "nextjs development inquiry",
    "react development quote",
    // IT
    "contattare agenzia web",
    "preventivo sito web",
    "sviluppo web contatto",
    "preventivo web design",
    "richiedere sito web",
    "richiedere hosting",
    "preventivo hosting",
    "hosting nodejs preventivo",
    "hosting wordpress preventivo",
    "sviluppo wordpress contatto",
    "pacchetto sito web hosting sconto",
    // Brand
    "pokyh.studio kontakt",
    "pokyh studio contact",
    "pokyh studio contatto",
  ],
  alternates: {
    canonical: `${siteConfig.url}/contact`,
    languages: {
      de: `${siteConfig.url}/contact`,
      en: `${siteConfig.url}/contact`,
      it: `${siteConfig.url}/contact`,
      "x-default": `${siteConfig.url}/contact`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/contact`,
    title: "Projekt anfragen – Webdesign & Hosting | pokyh.studio",
    description:
      "Webdesign, 3D, App & Managed Hosting ab €20/mo. Website + Hosting zusammen: 5% Rabatt auf Entwicklung. Angebot in 24h.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio – Projekt anfragen" }],
  },
}

export default function Contact() {
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
              { name: "Home", url: siteConfig.url },
              { name: "Kontakt", url: `${siteConfig.url}/contact` },
            ])
          ),
        }}
      />
      <ContactPage />
    </>
  )
}
