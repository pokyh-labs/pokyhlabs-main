import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import { fetchBlogs } from "@/lib/server-api"
import BlogsPage from "@/components/BlogsPage"

export const metadata: Metadata = {
  // Title with template: "Blog – Webdesign, 3D & Next.js | pokyh.studio" = 46 chars ✓
  title: "Blog – Webdesign, 3D & Next.js",
  description:
    "Webdesign-Blog von pokyh.studio: Artikel zu 3D Websites, Next.js, React, SEO & Hosting aus Südtirol. Praxistipps für Entwickler und Unternehmen.",
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
    title: "Blog – Webdesign, 3D & Next.js | pokyh.studio",
    description:
      "3D Websites, Next.js, React, SEO & Hosting — Artikel und Praxistipps vom Digital Studio Südtirol.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio Blog" }],
  },
}

export default async function Blog() {
  const blogs = await fetchBlogs(20)
  return <BlogsPage initialBlogs={blogs} />
}
