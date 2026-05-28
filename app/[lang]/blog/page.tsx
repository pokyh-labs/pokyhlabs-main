import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import { fetchBlogs } from "@/lib/server-api"
import type { Lang } from "@/lib/server-api"
import BlogsPage from "@/components/BlogsPage"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Blog – Webdesign, 3D & Next.js",
    description:
      "Webdesign-Blog von pokyh.studio: Artikel zu 3D Websites, Next.js, React, SEO & Hosting aus Südtirol. Praxistipps für Entwickler und Unternehmen.",
    keywords: [
      "webdesign blog",
      "webentwicklung blog",
      "3d website tipps",
      "digital studio südtirol blog",
      "nextjs tutorial",
      "react tutorial deutsch",
      "web design blog",
      "web development blog",
      "nextjs blog",
      "blog web design",
      "blog sviluppo web",
      "pokyh blog",
      "pokyh.studio articoli",
    ],
    alternates: {
      canonical: `${siteConfig.url}/${lang}/blog`,
      languages: {
        de: `${siteConfig.url}/de/blog`,
        en: `${siteConfig.url}/en/blog`,
        it: `${siteConfig.url}/it/blog`,
        "x-default": `${siteConfig.url}/de/blog`,
      },
    },
    openGraph: {
      url: `${siteConfig.url}/${lang}/blog`,
      title: "Blog – Webdesign, 3D & Next.js | pokyh.studio",
      description:
        "3D Websites, Next.js, React, SEO & Hosting — Artikel und Praxistipps vom Digital Studio Südtirol.",
      locale: lang === "en" ? "en_US" : lang === "it" ? "it_IT" : "de_AT",
      alternateLocale: lang === "de" ? ["en_US", "it_IT"] : lang === "en" ? ["de_AT", "it_IT"] : ["de_AT", "en_US"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio Blog" }],
    },
  }
}

export const dynamic = "force-dynamic"

export default async function Blog({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const blogs = await fetchBlogs(lang as Lang, 20)
  return <BlogsPage initialBlogs={blogs} />
}
