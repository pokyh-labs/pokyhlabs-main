"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPostClient({ blog }: { blog: BlogPost }) {
  const [views, setViews] = useState(blog.views)

  useEffect(() => {
    fetch(`/api/blogs/${blog.slug}/view`, { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.views != null) setViews(data.views) })
      .catch(() => {})
  }, [blog.slug])


  return (
    <article style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          minHeight: "50vh",
          backgroundColor: "var(--bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "120px 5vw 4rem",
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "12px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--black)",
              opacity: 0.45,
              textDecoration: "none",
              marginBottom: "2.5rem",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.45" }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Blog
          </Link>

          <div
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "12px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink)",
              marginBottom: "1.5rem",
            }}
          >
            {formatDate(blog.published_at)}
            {blog.author && (
              <span style={{ color: "var(--black)", opacity: 0.4, marginLeft: "1rem" }}>
                / {blog.author.username}
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: "clamp(2rem, 5.5vw, 5rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--black)",
              maxWidth: "900px",
            }}
          >
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
                lineHeight: 1.7,
                color: "var(--black)",
                opacity: 0.55,
                maxWidth: "700px",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {blog.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Cover image — full width, full height, never cropped */}
      {blog.image_url && (
        <div style={{ width: "100%", backgroundColor: "var(--bg)" }}>
          <img
            src={blog.image_url}
            alt={blog.image_alt ?? blog.title}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(12,12,12,0.12)", margin: "0 5vw" }} />

      {/* Content — beige throughout */}
      <div
        style={{
          backgroundColor: "var(--bg)",
          minHeight: "40vh",
          padding: "5rem 5vw 8rem",
        }}
      >
        <div
          style={{ maxWidth: "720px", margin: "0 auto" }}
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Footer */}
        <div
          style={{
            maxWidth: "720px",
            margin: "5rem auto 0",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(12,12,12,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "12px",
              letterSpacing: "0.08em",
              color: "var(--black)",
              opacity: 0.4,
            }}
          >
            {views} views
          </span>

          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "12px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink)",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7" }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
          >
            More articles
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <style>{`
        .blog-content {
          line-height: 1.8;
          font-size: clamp(1rem, 1.2vw, 1.1rem);
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: var(--black);
        }
        .blog-content h1, .blog-content h2, .blog-content h3,
        .blog-content h4, .blog-content h5, .blog-content h6 {
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 2.5rem 0 1rem;
          color: var(--black);
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .blog-content h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); }
        .blog-content h2 { font-size: clamp(1.4rem, 2.5vw, 1.9rem); }
        .blog-content h3 { font-size: clamp(1.1rem, 2vw, 1.4rem); }
        .blog-content p { margin: 1.25rem 0; color: rgba(12,12,12,0.75); }
        .blog-content a { color: var(--ink); text-underline-offset: 3px; }
        .blog-content a:hover { opacity: 0.7; }
        .blog-content ul, .blog-content ol {
          padding-left: 1.5rem;
          margin: 1.25rem 0;
          color: rgba(12,12,12,0.75);
        }
        .blog-content li { margin: 0.4rem 0; }
        .blog-content blockquote {
          border-left: 3px solid var(--ink);
          padding: 0.5rem 0 0.5rem 1.5rem;
          margin: 1.5rem 0;
          color: rgba(12,12,12,0.55);
          font-style: italic;
        }
        .blog-content code {
          background: rgba(12,12,12,0.07);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: var(--font-dm-mono), monospace;
          color: var(--black);
        }
        .blog-content pre {
          background: rgba(12,12,12,0.05);
          border: 1px solid rgba(12,12,12,0.1);
          border-radius: 8px;
          padding: 1.25rem 1.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .blog-content pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
          color: var(--black);
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
          display: block;
        }
        .blog-content figure {
          margin: 1.5rem 0;
          text-align: center;
        }
        .blog-content figcaption {
          font-size: 0.8rem;
          color: rgba(12,12,12,0.45);
          margin-top: 0.5rem;
          font-family: var(--font-dm-mono), monospace;
          letter-spacing: 0.05em;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(12,12,12,0.12);
          margin: 2.5rem 0;
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }
        .blog-content th, .blog-content td {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(12,12,12,0.12);
          text-align: left;
        }
        .blog-content th {
          background: rgba(12,12,12,0.05);
          color: var(--black);
          font-weight: 500;
        }
        .blog-content td { color: rgba(12,12,12,0.7); }
        .blog-content strong { color: var(--black); font-weight: 600; }
        .blog-content em { color: rgba(12,12,12,0.75); }
      `}</style>
    </article>
  )
}
