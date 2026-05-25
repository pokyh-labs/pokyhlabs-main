import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import { fetchBlogs } from "@/lib/server-api"
import BlogsPage from "@/components/BlogsPage"

export const metadata: Metadata = {
  title: "Blog – Webdesign, Entwicklung & Südtirol Tipps",
  description:
    "Artikel, Insights und Updates von pokyh.studio – 3D Websites, Webdesign, Webentwicklung und digitale Trends aus Südtirol. / Articles and insights on web design, development and 3D websites from South Tyrol. / Articoli su web design, sviluppo web e tendenze digitali dall'Alto Adige.",
  keywords: [
    // DE
    "webdesign blog",
    "webentwicklung blog",
    "3d website tipps",
    "digital studio südtirol blog",
    "website erstellen tipps",
    "seo tipps deutsch",
    "nextjs tutorial",
    "react tutorial deutsch",
    "webdesign trends",
    "website hosting tipps",
    // EN
    "web design blog",
    "web development blog",
    "3d website tips",
    "digital studio blog",
    "website creation tips",
    "seo tips",
    "nextjs blog",
    "react blog",
    "south tyrol tech",
    // IT
    "blog web design",
    "blog sviluppo web",
    "consigli siti web 3d",
    "blog studio digitale alto adige",
    "tendenze web design",
    "ottimizzazione seo",
    // Brand
    "pokyh blog",
    "pokyh.studio articoli",
  ],
  alternates: {
    canonical: `${siteConfig.url}/blog`,
    languages: {
      de: `${siteConfig.url}/blog`,
      en: `${siteConfig.url}/blog`,
      it: `${siteConfig.url}/blog`,
      "x-default": `${siteConfig.url}/blog`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/blog`,
    title: "Blog – Webdesign, Entwicklung & Digital Studio Südtirol | pokyh.studio",
    description:
      "Artikel und Insights zu 3D Websites, Webdesign, Webentwicklung und digitalen Trends von pokyh.studio – Digital Studio Südtirol.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio Blog" }],
  },
}

export default async function Blog() {
  const blogs = await fetchBlogs(20)
  return <BlogsPage initialBlogs={blogs} />
}
