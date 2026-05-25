import type { Metadata } from "next"
import { siteConfig, breadcrumbSchema } from "@/lib/seo.config"
import { fetchProjects } from "@/lib/server-api"
import WorksPage from "@/components/WorksPage"

export const metadata: Metadata = {
  // Title with template: "Portfolio & Referenzen | pokyh.studio" = 38 chars ✓
  title: "Portfolio & Referenzen",
  description:
    "Portfolio von pokyh.studio: 3D Websites, Webdesign & immersive digitale Erlebnisse aus Südtirol. Lass dich von unseren Arbeiten inspirieren und starte dein Projekt.",
  keywords: [
    // DE
    "portfolio webdesign südtirol",
    "3d website referenzen",
    "webdesign projekte portfolio",
    "website referenzen agentur",
    "web agentur portfolio südtirol",
    "digitale projekte südtirol",
    "webentwicklung beispiele",
    "immersive website beispiele",
    "nextjs projekte",
    "react projekte portfolio",
    // EN
    "web design portfolio south tyrol",
    "3d website portfolio",
    "web development projects",
    "digital studio portfolio",
    "interactive web projects examples",
    "immersive website portfolio",
    "creative web studio work",
    "nextjs portfolio",
    // IT
    "portfolio web design alto adige",
    "esempi siti web 3d",
    "progetti web design portfolio",
    "lavori web alto adige",
    "studio digitale portfolio",
    // Brand
    "pokyh.studio portfolio",
    "pokyhlabs projects",
  ],
  alternates: {
    canonical: `${siteConfig.url}/works`,
    languages: {
      de: `${siteConfig.url}/works`,
      en: `${siteConfig.url}/works`,
      it: `${siteConfig.url}/works`,
      "x-default": `${siteConfig.url}/works`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/works`,
    title: "Portfolio & Referenzen | pokyh.studio",
    description:
      "3D Websites, Webdesign & immersive digitale Erlebnisse von pokyh.studio – Digital Studio Südtirol. Referenzen und Projekte ansehen.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio Portfolio" }],
  },
}

export default async function Works() {
  const projects = await fetchProjects()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: siteConfig.url },
              { name: "Works", url: `${siteConfig.url}/works` },
            ])
          ),
        }}
      />
      <WorksPage initialProjects={projects} />
    </>
  )
}
