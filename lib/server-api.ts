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

async function fetchSSR(url: string, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
      clearTimeout(timer)
      return res
    } catch {
      clearTimeout(timer)
      if (attempt === retries) throw new Error(`fetch failed after ${retries + 1} attempts: ${url}`)
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw new Error('unreachable')
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetchSSR(`${BACKEND}/api/projects`)
    if (!res.ok) return []
    const data = await res.json()
    return data.projects ?? []
  } catch {
    return []
  }
}

export async function fetchBlogs(limit = 20): Promise<BlogSummary[]> {
  try {
    const res = await fetchSSR(`${BACKEND}/api/blogs?limit=${encodeURIComponent(limit)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.blogs ?? []
  } catch {
    return []
  }
}
