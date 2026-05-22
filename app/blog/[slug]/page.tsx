import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import BlogPostClient from "@/components/BlogPostClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3001"

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

async function getBlog(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BACKEND}/api/blogs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
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
    openGraph: {
      title: blog.title,
      description: blog.excerpt ?? undefined,
      images: blog.image_url ? [{ url: blog.image_url }] : [],
      type: "article",
      publishedTime: blog.published_at,
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

  return <BlogPostClient blog={blog} />
}
