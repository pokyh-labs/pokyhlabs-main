"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useT, useLanguage } from "@/lib/i18n/context"

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

const DATE_LOCALES: Record<string, string> = { de: "de-DE", it: "it-IT", en: "en-GB" }

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(DATE_LOCALES[lang] ?? "en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function clientFetchBlogs(lang: string): Promise<Blog[]> {
  return fetch(`/api/blogs?limit=20&lang=${encodeURIComponent(lang)}`)
    .then((r) => { if (!r.ok) throw new Error("API error"); return r.json() })
    .then((data) => data.blogs ?? [])
}

export default function BlogsPage({ initialBlogs = [] }: { initialBlogs?: Blog[] }) {
  const t = useT()
  const { lang } = useLanguage()
  const langLc = lang.toLowerCase()
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs)
  const [loading, setLoading] = useState(initialBlogs.length === 0)
  const [error, setError] = useState<string | null>(null)

  const loadBlogs = useCallback(() => {
    setLoading(true)
    setError(null)
    clientFetchBlogs(langLc)
      .then((list) => { setBlogs(list); setLoading(false) })
      .catch(() => { setError(t("blog_error")); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langLc])

  useEffect(() => {
    if (initialBlogs.length > 0) return
    loadBlogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Per-character fly-in for the headline (same effect as the contact hero).
  useEffect(() => {
    if (!headlineRef.current) return
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
  }, [])

  const [featured, ...rest] = blogs

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        /* ── Featured card ── */
        .bfeat {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          gap: clamp(1.75rem, 4vw, 4rem);
          align-items: center;
          text-decoration: none;
          border: 1px solid #2a2a2a;
          border-radius: 18px;
          padding: clamp(1.5rem, 3.5vw, 3rem);
          background: rgba(255,255,255,0.018);
          transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s cubic-bezier(.2,.8,.2,1);
          -webkit-tap-highlight-color: transparent;
        }
        .bfeat:hover {
          border-color: rgba(139,117,250,0.35);
          background: rgba(255,255,255,0.03);
          transform: translateY(-2px);
        }
        .bfeat__media {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 16 / 11;
          border: 1px solid #2a2a2a;
          background: #202020;
        }
        .bfeat__media img {
          display: block;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(.2,.8,.2,1);
        }
        .bfeat:hover .bfeat__media img { transform: scale(1.04); }
        .bfeat__readlink {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: clamp(1.5rem, 3vh, 2.25rem);
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a78bfa;
        }
        .bfeat__readlink svg { transition: transform 0.25s ease; }
        .bfeat:hover .bfeat__readlink svg { transform: translate(3px, -3px); }

        /* ── List rows ── */
        .brow {
          display: grid;
          grid-template-columns: 56px 132px minmax(0, 1fr) 52px;
          gap: clamp(1.25rem, 2.5vw, 2.25rem);
          align-items: center;
          padding: 2.1rem 1.4rem;
          margin: 0 -1.4rem;
          text-decoration: none;
          border-radius: 12px;
          transition: background 0.25s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .brow:hover { background: rgba(255,255,255,0.035); }
        .brow__thumb {
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          border: 1px solid #2a2a2a;
          background: #202020;
        }
        .brow__thumb img {
          display: block;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(.2,.8,.2,1);
        }
        .brow:hover .brow__thumb img { transform: scale(1.06); }
        .brow__circle {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 1px solid #2a2a2a;
          display: grid;
          place-items: center;
          color: #fff;
          transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
        }
        .brow:hover .brow__circle {
          border-color: rgba(139,117,250,0.7);
          background: rgba(89,61,248,0.14);
          transform: translate(2px, -2px);
        }
        .brow__title { transition: color 0.25s ease; }
        .brow:hover .brow__title { color: #c4b5fd; }

        .bplaceholder {
          width: 100%; height: 100%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(120% 120% at 20% 0%, rgba(89,61,248,0.22), rgba(89,61,248,0.02) 60%),
            #1f1e24;
        }
        .bplaceholder span {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(196,181,253,0.5);
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .bfeat { grid-template-columns: 1fr; gap: 1.5rem; }
          .bfeat__media { order: -1; aspect-ratio: 16 / 9; }
          .brow { grid-template-columns: 96px minmax(0, 1fr) 44px; padding: 1.7rem 1rem; margin: 0 -1rem; }
          .brow__idx { display: none; }
          .brow__circle { width: 44px; height: 44px; }
        }
        @media (max-width: 520px) {
          .brow { grid-template-columns: 84px minmax(0, 1fr); }
          .brow__circle { display: none; }
          .brow__excerpt { display: none; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "var(--bg)", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(28px, 6vw, 100px)" }}>
          <p style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--black)",
            opacity: 0.4,
            marginBottom: "1.75rem",
            animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 100ms both",
          }}>
            pokyh.studio / Blog
          </p>
          <h1
            ref={headlineRef}
            suppressHydrationWarning
            style={{
              color: "var(--black)",
              fontWeight: 500,
              fontFamily: "var(--font-inter)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontSize: "clamp(3rem, 8.5vw, 9.5rem)",
              userSelect: "none",
            }}
          >
            <span className="blog-line" data-text={t("blog_heading")} style={{ display: "block" }}>
              {t("blog_heading")}
            </span>
          </h1>
          <p style={{
            marginTop: "2rem",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(0.95rem, 1.2vw, 1.15rem)",
            color: "var(--black)",
            opacity: 0.5,
            maxWidth: 460,
            lineHeight: 1.65,
            fontWeight: 400,
            animation: "chIn 0.6s cubic-bezier(0.22,0.61,0.36,1) 900ms both",
          }}>
            {t("blog_subtitle")}
          </p>
        </div>

        <div style={{
          position: "absolute",
          bottom: 40,
          left: "clamp(28px, 6vw, 100px)",
          right: "clamp(28px, 6vw, 100px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--black)", opacity: 0.35, animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 1200ms both" }}>
            {t("menu_blog_desc")}
          </span>
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--black)", opacity: 0.35, animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 1400ms both" }}>
            {t("menu_blog_meta")}
          </span>
        </div>
      </div>

      {/* ── Article index ── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        backgroundColor: "#1a1a1a",
        minHeight: "100vh",
        padding: "clamp(60px,10vh,120px) clamp(28px,6vw,100px) clamp(80px,14vh,160px)",
        color: "#fff",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div
            data-reveal
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(3rem,7vh,5rem)" }}
          >
            <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-block", width: 28, height: 1, background: "#555" }} />
              {t("blog_latest")}
            </div>
            {!loading && !error && blogs.length > 0 && (
              <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, letterSpacing: "0.15em", color: "#444" }}>
                {String(blogs.length).padStart(2, "0")}
              </span>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadBlogs} />
          ) : blogs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {featured && <FeaturedCard blog={featured} lang={langLc} />}

              {rest.length > 0 && (
                <div style={{ marginTop: "clamp(2.5rem,5vh,4rem)" }}>
                  {rest.map((blog, i) => (
                    <BlogRow key={blog.id} blog={blog} index={i + 2} lang={langLc} />
                  ))}
                  <div style={{ borderTop: "1px solid #2a2a2a" }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Shared bits ──────────────────────────────────────────────────── */

function MetaPills({ blog }: { blog: Blog }) {
  const t = useT()
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      {blog.author && (
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: "0.08em", padding: "5px 12px", borderRadius: 999, border: "1px solid #2a2a2a", color: "#777" }}>
          {blog.author.username}
        </span>
      )}
      <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: "0.08em", color: "#555" }}>
        {blog.views} {t("blog_views_suffix")}
      </span>
    </div>
  )
}

function Thumb({ blog, className }: { blog: Blog; className: string }) {
  return (
    <div className={className} aria-hidden={!blog.image_url}>
      {blog.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blog.image_url} alt={blog.image_alt ?? blog.title} loading="lazy" decoding="async" />
      ) : (
        <div className="bplaceholder"><span>pokyh.studio</span></div>
      )}
    </div>
  )
}

/* ── Featured (newest) post ───────────────────────────────────────── */

function FeaturedCard({ blog, lang }: { blog: Blog; lang: string }) {
  const t = useT()
  return (
    <article data-reveal>
      <a className="bfeat" href={`/${lang}/blog/${blog.slug}`}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#593DF8" }}>
              {t("blog_featured")}
            </span>
            <span style={{ display: "inline-block", flexShrink: 0, width: 24, height: 1, background: "#3a3a3a" }} />
            <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: "0.08em", color: "#555" }}>
              {formatDate(blog.published_at, lang)}
            </span>
          </div>

          <h2 style={{
            fontSize: "clamp(1.75rem, 3.6vw, 3.1rem)",
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: "#fff",
            fontFamily: "var(--font-inter)",
            marginBottom: "1.25rem",
            overflowWrap: "anywhere",
          }}>
            {blog.title}
          </h2>

          {blog.excerpt && (
            <p style={{
              fontSize: "clamp(0.9rem, 1.15vw, 1.05rem)",
              lineHeight: 1.7,
              color: "#888",
              marginBottom: "1.75rem",
              maxWidth: 520,
              fontFamily: "var(--font-inter)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {blog.excerpt}
            </p>
          )}

          <MetaPills blog={blog} />

          <span className="bfeat__readlink">
            {t("blog_read")}
            <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}>
              <path d="M7 17 L17 7 M9 7 H17 V15" />
            </svg>
          </span>
        </div>

        <Thumb blog={blog} className="bfeat__media" />
      </a>
    </article>
  )
}

/* ── Index rows (2nd post onwards) ────────────────────────────────── */

function BlogRow({ blog, index, lang }: { blog: Blog; index: number; lang: string }) {
  const t = useT()
  return (
    <article data-reveal style={{ borderTop: "1px solid #2a2a2a" }}>
      <a className="brow" href={`/${lang}/blog/${blog.slug}`}>
        <span className="brow__idx" style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#593DF8", letterSpacing: "0.15em" }}>
          {String(index).padStart(2, "0")}
        </span>

        <Thumb blog={blog} className="brow__thumb" />

        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, letterSpacing: "0.08em", color: "#555", marginBottom: "0.7rem" }}>
            {formatDate(blog.published_at, lang)}
          </div>
          <h3 className="brow__title" style={{
            fontSize: "clamp(1.2rem, 2.2vw, 1.75rem)",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontFamily: "var(--font-inter)",
            marginBottom: "0.65rem",
            overflowWrap: "anywhere",
          }}>
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="brow__excerpt" style={{
              fontSize: "0.92rem",
              lineHeight: 1.65,
              color: "#777",
              maxWidth: 560,
              fontFamily: "var(--font-inter)",
              marginBottom: "0.9rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {blog.excerpt}
            </p>
          )}
          <MetaPills blog={blog} />
        </div>

        <div className="brow__circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}>
            <path d="M7 17 L17 7 M9 7 H17 V15" />
          </svg>
        </div>
      </a>
    </article>
  )
}

/* ── States ───────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div>
      <style>{`@keyframes blogPulse{0%,100%{opacity:.45}50%{opacity:.9}}`}</style>
      {/* Featured skeleton */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 18, padding: "clamp(1.5rem, 3.5vw, 3rem)", display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <div style={{ height: 12, width: 140, background: "#2a2a2a", borderRadius: 4, animation: "blogPulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "clamp(2rem,3.6vw,3rem)", width: "70%", background: "#222", borderRadius: 6 }} />
        <div style={{ height: 14, width: "85%", background: "#1e1e1e", borderRadius: 4 }} />
        <div style={{ height: 14, width: "60%", background: "#1e1e1e", borderRadius: 4 }} />
      </div>
      {/* Row skeletons */}
      {[0, 1].map((i) => (
        <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid #2a2a2a", marginTop: i === 0 ? "3rem" : 0, padding: "2.1rem 0", display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ width: 132, aspectRatio: "4 / 3", background: "#222", borderRadius: 10, flexShrink: 0, animation: "blogPulse 1.5s ease-in-out infinite", animationDelay: `${i * 200}ms` }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, width: 90, background: "#2a2a2a", borderRadius: 4, marginBottom: "1rem" }} />
            <div style={{ height: 22, width: `${65 - i * 10}%`, background: "#222", borderRadius: 5, marginBottom: "0.8rem" }} />
            <div style={{ height: 13, width: "75%", background: "#1e1e1e", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  const t = useT()
  return (
    <div data-reveal style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.5rem" }}>
      <p style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 500, color: "#3a3a3a", lineHeight: 1.3, fontFamily: "var(--font-inter)" }}>
        {t("blog_empty_title")}
      </p>
      <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 13, letterSpacing: "0.08em", color: "#555" }}>
        {t("blog_empty_body")}
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT()
  return (
    <div data-reveal style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 13, letterSpacing: "0.08em", color: "#666" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "none",
            border: "1px solid #333",
            color: "#888",
            padding: "9px 22px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,117,250,0.6)"; e.currentTarget.style.color = "#c4b5fd" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888" }}
        >
          {t("blog_retry")}
        </button>
      )}
    </div>
  )
}
