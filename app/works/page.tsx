import type { Metadata } from "next"
import { siteConfig, breadcrumbSchema } from "@/lib/seo.config"
import { fetchProjects } from "@/lib/server-api"
import WorksPage from "@/components/WorksPage"

export const metadata: Metadata = {
  title: "Our Work – Projects & Portfolio",
  description:
    "Portfolio von pokyh.studio – 3D Websites, Webdesign-Projekte und immersive digitale Erlebnisse. / Portfolio of 3D websites, web design projects & immersive digital experiences by pokyh.studio. / Portfolio di siti web 3D, progetti web design ed esperienze digitali immersive.",
  keywords: [
    // DE
    "portfolio webdesign",
    "3d website beispiele",
    "webdesign projekte",
    "website referenzen",
    "web agentur portfolio",
    "digitale projekte südtirol",
    "webentwicklung beispiele",
    "immersive websites portfolio",
    // EN
    "web design portfolio",
    "3d website examples",
    "web development projects",
    "digital studio portfolio",
    "interactive web projects",
    "immersive website examples",
    "web design work",
    "creative web portfolio",
    // IT
    "portfolio web design",
    "esempi siti web 3d",
    "progetti web design",
    "portfolio studio digitale",
    "lavori web alto adige",
    "portfolio sviluppo web",
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
    title: "Our Work – Projects & Portfolio | pokyh.studio",
    description:
      "3D Websites, Webdesign & immersive digitale Erlebnisse von pokyh.studio. / 3D websites, web design & immersive digital experiences. / Siti web 3D, web design ed esperienze digitali.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
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
