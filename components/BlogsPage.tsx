"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Header from "@/components/Header"

interface Blog {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function BlogsPage() {
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<(HTMLElement | null)[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/blogs?limit=20")
      .then((r) => {
        if (!r.ok) throw new Error("API error")
        return r.json()
      })
      .then((data) => {
        setBlogs(data.blogs ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load blog posts.")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const cursor = document.createElement("div")
    cursor.style.cssText =
      "position:fixed;top:0;left:0;width:400px;height:400px;border-radius:50%;" +
      "background-image:radial-gradient(circle,rgba(89,61,248,0.10)0%,transparent 70%);" +
      "pointer-events:none;transform:translate(-50%,-50%);z-index:0;"
    document.body.appendChild(cursor)
    const moveCursor = (e: MouseEvent) =>
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.8, ease: "power3.out" })
    window.addEventListener("mousemove", moveCursor)

    if (headlineRef.current) {
      const lines = headlineRef.current.querySelectorAll<HTMLSpanElement>(".blog-line")
      lines.forEach((line, li) => {
        const text = (line.getAttribute("data-text") ?? "").trim()
        line.textContent = ""
        let idx = 0
        for (const ch of text) {
          if (ch === " ") {
            const sp = document.createElement("span")
            sp.className = "sp"
            line.appendChild(sp)
            continue
          }
          const s = document.createElement("span")
          s.className = "ch"
          s.textContent = ch
          s.style.setProperty("--d", `${li * 120 + idx * 35}ms`)
          line.appendChild(s)
          idx++
        }
      })
    }

    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { borderTopLeftRadius: "0%", borderTopRightRadius: "0%" },
        {
          borderTopLeftRadius: "50% 150px",
          borderTopRightRadius: "50% 150px",
          ease: "none",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      )
    }

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      if (document.body.contains(cursor)) document.body.removeChild(cursor)
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  // Animate cards after blogs have loaded
  useEffect(() => {
    if (loading || !contentRef.current) return
    cardsRef.current.forEach((el) => {
      if (!el) return
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 55%",
            scrub: true,
          },
        }
      )
    })
  }, [loading])

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          backgroundColor: "var(--bg)",
          zIndex: 1,
        }}
      >
        <Header />
        <div className="headline-wrapper">
          <div className="headline-content">
            <h1
              ref={headlineRef}
              style={{
                width: "100%",
                color: "#0c0c0c",
                fontWeight: 500,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontSize: "clamp(28px, 5.6vw, 96px)",
                userSelect: "none",
              }}
            >
              <span
                className="blog-line"
                data-text="Blog."
                suppressHydrationWarning
                style={{ display: "block" }}
              >
                Blog.
              </span>
            </h1>
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace",
                fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                fontWeight: 400,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#0c0c0c",
                opacity: 0.7,
                userSelect: "none",
                animation: "chIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) 900ms both",
              }}
            >
              Thoughts, updates &amp; insights.
            </p>
          </div>
        </div>
      </div>

      {/* Dark section — blog posts */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          padding: "10vh 5vw",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: "5rem",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ display: "inline-block", width: "28px", height: "1px", background: "#555" }} />
            Latest Articles
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : blogs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {blogs.map((blog, i) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  index={i}
                  ref={(el: HTMLElement | null) => {
                    cardsRef.current[i] = el
                  }}
                />
              ))}
              <div style={{ borderTop: "1px solid #2a2a2a" }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ borderTop: "1px solid #2a2a2a", padding: "3.5rem 0" }}>
          <div
            style={{
              height: "12px",
              width: "40px",
              background: "#2a2a2a",
              borderRadius: "4px",
              marginBottom: "1.5rem",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              height: "clamp(1.5rem, 3vw, 2.5rem)",
              width: `${60 + i * 10}%`,
              background: "#222",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          />
          <div
            style={{
              height: "14px",
              width: "80%",
              background: "#1e1e1e",
              borderRadius: "4px",
            }}
          />
          <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <p style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 400, color: "#333", lineHeight: 1.3 }}>
        No posts yet.
      </p>
      <p
        style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "13px",
          letterSpacing: "0.08em",
          color: "#444",
        }}
      >
        Check back soon — articles are on the way.
      </p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "40vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: "13px",
          letterSpacing: "0.08em",
          color: "#555",
        }}
      >
        {message}
      </p>
    </div>
  )
}

import { forwardRef } from "react"

const BlogCard = forwardRef<HTMLElement, { blog: Blog; index: number }>(({ blog, index }, ref) => (
  <article ref={ref as React.Ref<HTMLElement>} style={{ borderTop: "1px solid #2a2a2a" }}>
    <a
      href={`/blog/${blog.slug}`}
      style={{ display: "block", padding: "3.5rem 0", textDecoration: "none", cursor: "pointer" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "1.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "12px",
            color: "#593DF8",
            letterSpacing: "0.15em",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: "12px",
            color: "#444",
            letterSpacing: "0.08em",
          }}
        >
          {formatDate(blog.published_at)}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              color: "#fff",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            {blog.title}
          </h2>
          {blog.excerpt && (
            <p
              style={{
                fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)",
                lineHeight: 1.7,
                color: "#888",
                marginBottom: "1.5rem",
                maxWidth: "600px",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {blog.excerpt}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {blog.author && (
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  border: "1px solid #2a2a2a",
                  color: "#555",
                }}
              >
                {blog.author.username}
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "#444",
              }}
            >
              {blog.views} views
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "1px solid #2a2a2a",
            display: "grid",
            placeItems: "center",
            color: "#fff",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}
          >
            <path d="M7 17 L17 7 M9 7 H17 V15" />
          </svg>
        </div>
      </div>
    </a>
  </article>
))
BlogCard.displayName = "BlogCard"
