import type { Metadata } from "next"
import { siteConfig, faqSchema, breadcrumbSchema } from "@/lib/seo.config"
import ContactPage from "@/components/ContactPage"

export const metadata: Metadata = {
  title: "Contact – Start a Project",
  description:
    "Starte dein Projekt mit pokyh.studio. Frontend, Backend, 3D, SEO, Hosting ab €20/mo, WordPress & E-Commerce. / Start your project with pokyh.studio. / Inizia il tuo progetto con pokyh.studio.",
  keywords: [
    // DE
    "website anfragen",
    "webdesign anfrage",
    "projekt starten",
    "webseite beauftragen",
    "web agentur kontakt",
    "website angebot",
    "webdesign kosten",
    "webentwicklung beauftragen",
    "website kaufen kontakt",
    "hosting anfragen",
    "website hosting beauftragen",
    "wordpress beauftragen",
    "e-commerce beauftragen",
    // EN
    "hire web designer",
    "start web project",
    "web design quote",
    "contact web agency",
    "get website quote",
    "hire web developer",
    "web development inquiry",
    "hire web hosting",
    "get hosting quote",
    "wordpress development inquiry",
    "e-commerce development quote",
    // IT
    "contattare agenzia web",
    "preventivo sito web",
    "sviluppo web contatto",
    "preventivo web design",
    "richiedere sito web",
    "richiedere hosting",
    "preventivo hosting",
    "sviluppo wordpress contatto",
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
    title: "Contact – Start a Project | pokyh.studio",
    description:
      "Frontend, Backend, 3D, SEO, Hosting ab €20/mo. Starte dein Projekt mit pokyh.studio. / Start your web project today.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
  },
}

export default function Contact() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: siteConfig.url },
              { name: "Contact", url: `${siteConfig.url}/contact` },
            ])
          ),
        }}
      />
      <ContactPage />
    </>
  )
}
