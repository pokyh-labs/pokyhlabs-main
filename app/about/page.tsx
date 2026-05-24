import type { Metadata } from "next"
import { siteConfig, breadcrumbSchema } from "@/lib/seo.config"
import AboutPage from "@/components/AboutPage"

export const metadata: Metadata = {
  title: "About – Built by Two",
  description:
    "pokyh.studio ist ein Digital Studio aus Südtirol – gegründet von zwei Entwicklern mit Leidenschaft für Computer Science, 3D Websites und immersive Web-Erlebnisse. / A digital studio from South Tyrol built by two developers. / Studio digitale dell'Alto Adige fondato da due sviluppatori.",
  keywords: [
    // DE
    "pokyh studio team",
    "webdesign studio südtirol",
    "web developer südtirol",
    "digital studio gründer",
    "software entwickler südtirol",
    "web agentur team",
    // EN
    "pokyh studio about",
    "web developers south tyrol",
    "digital studio founders",
    "web design team italy",
    "software engineers south tyrol",
    // IT
    "team studio digitale",
    "sviluppatori web alto adige",
    "studio digitale fondatori",
    "web developer alto adige",
    "chi siamo web design",
    // Brand
    "plattnericus",
    "ryhox",
    "pokyhlabs",
  ],
  alternates: {
    canonical: `${siteConfig.url}/about`,
    languages: {
      de: `${siteConfig.url}/about`,
      en: `${siteConfig.url}/about`,
      it: `${siteConfig.url}/about`,
      "x-default": `${siteConfig.url}/about`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/about`,
    title: "About – Built by Two | pokyh.studio",
    description:
      "Zwei Entwickler. Ein Studio. pokyh.studio baut 3D Websites und immersive Web-Erlebnisse aus Südtirol. / Two developers. One studio. / Due sviluppatori. Uno studio.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
  },
}

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: siteConfig.url },
              { name: "About", url: `${siteConfig.url}/about` },
            ])
          ),
        }}
      />
      <AboutPage />
    </>
  )
}
