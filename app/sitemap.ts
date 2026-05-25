import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo.config"

export const revalidate = 3600

type BlogPost = {
  slug: string
  title?: string
  image_url?: string | null
  updated_at?: string
  created_at?: string
}

async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const base = process.env.BACKEND_URL ?? "http://localhost:3001"
    const res = await fetch(`${base}/api/blogs?limit=1000`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.blogs) ? data.blogs : Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// Hreflang alternates: all languages resolve to the same URL (single-domain i18n)
function hreflangAlternates(path: string): Record<string, string> {
  const url = `${siteConfig.url}${path}`
  return { de: url, en: url, it: url, "x-default": url }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = siteConfig.pages.map(
    ({ path, priority, changeFreq }) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: new Date(),
      changeFrequency: changeFreq,
      priority,
      alternates: { languages: hreflangAlternates(path) },
    })
  )

  const blogs = await fetchPublishedBlogs()
  const blogPages: MetadataRoute.Sitemap = blogs.map((post) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updated_at
        ? new Date(post.updated_at)
        : post.created_at
          ? new Date(post.created_at)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: hreflangAlternates(`/blog/${post.slug}`) },
    }
    // Include image in sitemap if blog has a cover image
    if (post.image_url) {
      const imageUrl = post.image_url.startsWith("http")
        ? post.image_url
        : `${siteConfig.url}${post.image_url}`
      ;(entry as Record<string, unknown>).images = [imageUrl]
    }
    return entry
  })

  return [...staticPages, ...blogPages]
}
