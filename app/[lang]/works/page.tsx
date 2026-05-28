import type { Metadata } from "next"
import { siteConfig, breadcrumbSchema } from "@/lib/seo.config"
import { fetchProjects } from "@/lib/server-api"
import type { Lang } from "@/lib/server-api"
import WorksPage from "@/components/WorksPage"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Portfolio & Referenzen",
    description:
      "Portfolio von pokyh.studio: 3D Websites, Webdesign & immersive digitale Erlebnisse aus Südtirol. Lass dich von unseren Arbeiten inspirieren und starte dein Projekt.",
    keywords: [
      "portfolio webdesign südtirol",
      "3d website referenzen",
      "webdesign projekte portfolio",
      "web design portfolio south tyrol",
      "3d website portfolio",
      "portfolio web design alto adige",
      "pokyh.studio portfolio",
      "pokyhlabs projects",
    ],
    alternates: {
      canonical: `${siteConfig.url}/${lang}/works`,
      languages: {
        de: `${siteConfig.url}/de/works`,
        en: `${siteConfig.url}/en/works`,
        it: `${siteConfig.url}/it/works`,
        "x-default": `${siteConfig.url}/de/works`,
      },
    },
    openGraph: {
      url: `${siteConfig.url}/${lang}/works`,
      title: "Portfolio & Referenzen | pokyh.studio",
      description:
        "3D Websites, Webdesign & immersive digitale Erlebnisse von pokyh.studio – Digital Studio Südtirol. Referenzen und Projekte ansehen.",
      locale: lang === "en" ? "en_US" : lang === "it" ? "it_IT" : "de_AT",
      alternateLocale: lang === "de" ? ["en_US", "it_IT"] : lang === "en" ? ["de_AT", "it_IT"] : ["de_AT", "en_US"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio Portfolio" }],
    },
  }
}

export const dynamic = "force-dynamic"

export default async function Works({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const projects = await fetchProjects(lang as Lang)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: `${siteConfig.url}/${lang}` },
              { name: "Works", url: `${siteConfig.url}/${lang}/works` },
            ])
          ),
        }}
      />
      <WorksPage initialProjects={projects} />
    </>
  )
}
