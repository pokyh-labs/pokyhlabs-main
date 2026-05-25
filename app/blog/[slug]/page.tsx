import type { Metadata } from "next"
import { notFound } from "next/navigation"
import BlogPostClient from "@/components/BlogPostClient"
import { siteConfig, articleSchema, breadcrumbSchema } from "@/lib/seo.config"

const BACKEND = (process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '')

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  image_url: string | null
  image_alt: string | null
  published_at: string
  views: number
  author: { username: string } | null
}

async function getBlog(slug: string, retries = 2): Promise<BlogPost | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    try {
      const res = await fetch(`${BACKEND}/api/blogs/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (res.status === 404) return null
      if (!res.ok) {
        if (attempt < retries) { await new Promise(r => setTimeout(r, 400 * (attempt + 1))); continue }
        return null
      }
      return res.json()
    } catch {
      clearTimeout(timer)
      if (attempt < retries) { await new Promise(r => setTimeout(r, 400 * (attempt + 1))); continue }
      return null
    }
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlog(slug)
  if (!blog) return { title: "Post not found" }
  return {
    title: blog.title,
    description: blog.excerpt ?? undefined,
    authors: blog.author ? [{ name: blog.author.username }] : [{ name: "pokyh.studio" }],
    alternates: {
      canonical: `${siteConfig.url}/blog/${slug}`,
      languages: {
        de: `${siteConfig.url}/blog/${slug}`,
        en: `${siteConfig.url}/blog/${slug}`,
        it: `${siteConfig.url}/blog/${slug}`,
        "x-default": `${siteConfig.url}/blog/${slug}`,
      },
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt ?? undefined,
      images: blog.image_url
        ? [{ url: blog.image_url, alt: blog.image_alt ?? blog.title }]
        : [{ url: "/opengraph-image", width: 1200, height: 630, alt: blog.title }],
      type: "article",
      publishedTime: blog.published_at,
      authors: blog.author ? [blog.author.username] : ["pokyh.studio"],
      locale: "de_AT",
      alternateLocale: ["en_US", "it_IT"],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const blog = await getBlog(slug)
  if (!blog) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({ ...blog, author: blog.author?.username ?? null })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: siteConfig.url },
              { name: "Blog", url: `${siteConfig.url}/blog` },
              { name: blog.title, url: `${siteConfig.url}/blog/${blog.slug}` },
            ])
          ),
        }}
      />
      <BlogPostClient blog={blog} />
    </>
  )
}
