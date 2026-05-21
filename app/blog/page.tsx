import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import BlogsPage from "@/components/BlogsPage"

export const metadata: Metadata = {
  title: "Blog – Thoughts & Insights",
  description: "Articles, updates and insights from pokyh.studio.",
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
  openGraph: {
    url: `${siteConfig.url}/blog`,
    title: "Blog | pokyh.studio",
    description: "Articles, updates and insights from pokyh.studio.",
    locale: "de_AT",
  },
}

export default function Blog() {
  return <BlogsPage />
}
