import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo.config"

export const revalidate = 3600

const LANGS = ['de', 'en', 'it'] as const
type Lang = typeof LANGS[number]

type BlogRow = {
  slug: string
  slug_de?: string | null
  slug_en?: string | null
  slug_it?: string | null
  updated_at?: string
  created_at?: string
  image_url?: string | null
}

async function fetchPublishedBlogs(): Promise<BlogRow[]> {
  try {
    const base = (process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, "")
    const res = await fetch(`${base}/api/blogs?lang=de&limit=1000&include=alternates`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.blogs) ? data.blogs : Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function langAlternates(pathByLang: Record<Lang, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of LANGS) {
    out[l] = `${siteConfig.url}${pathByLang[l]}`
  }
  out["x-default"] = `${siteConfig.url}${pathByLang.de}`
  return out
}

function staticAlternates(basePath: string): Record<string, string> {
  const pathByLang = {} as Record<Lang, string>
  for (const l of LANGS) {
    pathByLang[l] = `/${l}${basePath === '/' ? '' : basePath}`
  }
  return langAlternates(pathByLang)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await fetchPublishedBlogs()

  // Static pages: emit once per language
  const staticPages: MetadataRoute.Sitemap = siteConfig.pages.flatMap(
    ({ path, priority, changeFreq, lastModified, images }) =>
      LANGS.map(l => ({
        url: `${siteConfig.url}/${l}${path === '/' ? '' : path}`,
        lastModified: new Date(lastModified),
        changeFrequency: changeFreq,
        priority,
        alternates: { languages: staticAlternates(path) },
        ...(images?.length && l === 'de' ? { images } : {}),
      }))
  )

  // Blog posts: emit once per language per post, using per-language slugs
  const blogPages: MetadataRoute.Sitemap = blogs.flatMap((post) => {
    const slugs: Record<Lang, string> = {
      de: post.slug_de || post.slug || '',
      en: post.slug_en || post.slug || '',
      it: post.slug_it || post.slug || '',
    }

    const lastMod = post.updated_at
      ? new Date(post.updated_at)
      : post.created_at
        ? new Date(post.created_at)
        : new Date()

    const blogAlternates = langAlternates({
      de: `/de/blog/${slugs.de}`,
      en: `/en/blog/${slugs.en}`,
      it: `/it/blog/${slugs.it}`,
    })

    return LANGS.filter(l => slugs[l]).map(l => ({
      url: `${siteConfig.url}/${l}/blog/${slugs[l]}`,
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages: blogAlternates },
      ...(post.image_url && l === 'de' ? {
        images: [post.image_url.startsWith("http") ? post.image_url : `${siteConfig.url}${post.image_url}`]
      } : {}),
    }))
  })

  return [...staticPages, ...blogPages]
}
