import type { Metadata } from "next"
import { notFound } from "next/navigation"
import BlogPostClient from "@/components/BlogPostClient"
import { siteConfig, articleSchema, breadcrumbSchema } from "@/lib/seo.config"
import { fetchBlog } from "@/lib/server-api"
import type { Lang } from "@/lib/server-api"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const blog = await fetchBlog(slug, lang as Lang)
  if (!blog) return { title: "Post not found" }

  const alts = blog.alternates ?? {}
  return {
    title: blog.title,
    description: blog.excerpt ?? undefined,
    authors: blog.author ? [{ name: blog.author.username }] : [{ name: "pokyh.studio" }],
    alternates: {
      canonical: `${siteConfig.url}/${lang}/blog/${slug}`,
      languages: {
        de: alts.de ? `${siteConfig.url}/de/blog/${alts.de}` : `${siteConfig.url}/de/blog/${slug}`,
        en: alts.en ? `${siteConfig.url}/en/blog/${alts.en}` : `${siteConfig.url}/en/blog/${slug}`,
        it: alts.it ? `${siteConfig.url}/it/blog/${alts.it}` : `${siteConfig.url}/it/blog/${slug}`,
        "x-default": alts.de ? `${siteConfig.url}/de/blog/${alts.de}` : `${siteConfig.url}/de/blog/${slug}`,
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
      locale: lang === "en" ? "en_US" : lang === "it" ? "it_IT" : "de_AT",
      alternateLocale: lang === "de" ? ["en_US", "it_IT"] : lang === "en" ? ["de_AT", "it_IT"] : ["de_AT", "en_US"],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const blog = await fetchBlog(slug, lang as Lang)
  if (!blog) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({
              ...blog,
              author: blog.author?.username ?? null,
              updatedAt: blog.updated_at ?? blog.published_at,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: `${siteConfig.url}/${lang}` },
              { name: "Blog", url: `${siteConfig.url}/${lang}/blog` },
              { name: blog.title, url: `${siteConfig.url}/${lang}/blog/${blog.slug}` },
            ])
          ),
        }}
      />
      <BlogPostClient blog={blog} />
    </>
  )
}
