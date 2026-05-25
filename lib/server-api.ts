// Server-side data fetching — only imported in server components (no "use client")
// Uses BACKEND_URL env var, falling back to the current PORT so it always points
// at the running process regardless of environment.

const BACKEND = (process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '')

export interface Project {
  id: number
  title: string
  description: string
  tags: string[]
  url?: string | null
  image_url?: string | null
  image_alt?: string | null
  year: number
  status: 'live' | 'wip' | 'concept'
}

export interface BlogSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  image_alt: string | null
  published_at: string
  views: number
  author: { username: string } | null
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${BACKEND}/api/projects`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.projects ?? []
  } catch {
    return []
  }
}

export async function fetchBlogs(limit = 20): Promise<BlogSummary[]> {
  try {
    const res = await fetch(`${BACKEND}/api/blogs?limit=${limit}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.blogs ?? []
  } catch {
    return []
  }
}
