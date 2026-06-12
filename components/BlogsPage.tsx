"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useT, useLanguage } from "@/lib/i18n/context"

type SortMode = "new" | "old" | "views"

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
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("new")

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

  // Client-side search + sort. The featured card only makes sense for the
  // default view (newest first, no search) — otherwise everything is a row.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? blogs.filter((b) =>
          b.title.toLowerCase().includes(q) ||
          (b.excerpt ?? "").toLowerCase().includes(q) ||
          (b.author?.username ?? "").toLowerCase().includes(q))
      : [...blogs]
    if (sort === "old") list.sort((a, b) => +new Date(a.published_at) - +new Date(b.published_at))
    else if (sort === "views") list.sort((a, b) => b.views - a.views)
    else list.sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at))
    return list
  }, [blogs, query, sort])

  const showFeatured = !query.trim() && sort === "new" && filtered.length > 0
  const featured = showFeatured ? filtered[0] : null
  const rest = showFeatured ? filtered.slice(1) : filtered

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        @keyframes heroMouse {
          0%, 100% { opacity: 0.45; transform: translateY(0); }
          50%      { opacity: 0.9; transform: translateY(3px); }
        }

        /* ── Search + sort toolbar ── */
        .btools {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: clamp(2.75rem, 6vh, 4.5rem);
        }
        .btools__search {
          position: relative;
          flex: 1 1 280px;
          min-width: 220px;
        }
        .btools__searchIcon {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          width: 15px; height: 15px;
          stroke: #555;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          pointer-events: none;
          transition: stroke 0.2s ease;
        }
        .btools__search:focus-within .btools__searchIcon { stroke: #a78bfa; }
        .btools__search input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid #2a2a2a;
          border-radius: 999px;
          padding: 12px 44px 12px 44px;
          color: #fff;
          font-family: var(--font-dm-mono), monospace;
          font-size: 13px;
          letter-spacing: 0.04em;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .btools__search input::placeholder { color: #555; }
        .btools__search input:focus {
          outline: none;
          border-color: rgba(139,117,250,0.6);
          background: rgba(255,255,255,0.05);
        }
        .btools__search input::-webkit-search-cancel-button { display: none; }
        .btools__clear {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 26px; height: 26px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.07);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btools__clear:hover { background: rgba(255,255,255,0.14); }
        .btools__clear svg {
          width: 11px; height: 11px;
          stroke: #aaa;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
        }
        .btools__sorts { display: flex; gap: 8px; flex-wrap: wrap; }
        .bpill {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid #2a2a2a;
          background: none;
          color: #777;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .bpill:hover { border-color: #3d3d3d; color: #aaa; }
        .bpill--on {
          border-color: rgba(139,117,250,0.7);
          color: #c4b5fd;
          background: rgba(89,61,248,0.14);
        }
        .bpill--on:hover { border-color: rgba(139,117,250,0.7); color: #c4b5fd; }
        .btools__count {
          margin-left: auto;
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #555;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .btools__count { margin-left: 0; width: 100%; text-align: right; }
        }

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
          transition: border-color 0.3s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .bfeat:hover { border-color: rgba(139,117,250,0.45); }
        .bfeat--noimg { grid-template-columns: minmax(0, 1fr); }
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
        }
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
          position: relative;
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr) 52px;
          gap: clamp(1.25rem, 2.5vw, 2.25rem);
          align-items: center;
          padding: 2.1rem 1.4rem;
          margin: 0 -1.4rem;
          text-decoration: none;
          border-radius: 12px;
          transition: background 0.25s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .brow:hover { background: rgba(255,255,255,0.035); z-index: 5; }
        /* Floating image preview — pops out of the row on hover (desktop only). */
        .brow__thumb {
          position: absolute;
          right: clamp(110px, 14vw, 220px);
          top: 50%;
          width: clamp(190px, 17vw, 250px);
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #2a2a2a;
          background: #202020;
          box-shadow: 0 24px 50px -20px rgba(0,0,0,0.65);
          opacity: 0;
          transform: translateY(-50%) rotate(-5deg) scale(0.82);
          transition: opacity 0.3s ease, transform 0.5s cubic-bezier(.2,.8,.2,1);
          pointer-events: none;
          z-index: 2;
        }
        .brow:hover .brow__thumb {
          opacity: 1;
          transform: translateY(-50%) rotate(-2deg) scale(1);
        }
        .brow__thumb img {
          display: block;
          width: 100%; height: 100%;
          object-fit: cover;
        }
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

        /* Touch devices have no hover — show the image inline instead. */
        @media (hover: none), (pointer: coarse) {
          .brow { grid-template-columns: 56px 132px minmax(0, 1fr) 52px; }
          .brow--noimg { grid-template-columns: 56px minmax(0, 1fr) 52px; }
          .brow__thumb {
            position: static;
            width: 100%;
            opacity: 1;
            transform: none;
            box-shadow: none;
            border-radius: 10px;
          }
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .bfeat { grid-template-columns: 1fr; gap: 1.5rem; }
          .bfeat__media { order: -1; aspect-ratio: 16 / 9; }
          .brow, .brow--noimg { grid-template-columns: 96px minmax(0, 1fr) 44px; padding: 1.7rem 1rem; margin: 0 -1rem; }
          .brow--noimg { grid-template-columns: minmax(0, 1fr) 44px; }
          .brow__idx { display: none; }
          .brow__circle { width: 44px; height: 44px; }
          .brow__thumb {
            position: static;
            width: 100%;
            opacity: 1;
            transform: none;
            box-shadow: none;
            border-radius: 10px;
          }
        }
        @media (max-width: 520px) {
          .brow { grid-template-columns: 84px minmax(0, 1fr); }
          .brow--noimg { grid-template-columns: minmax(0, 1fr); }
          .brow__circle { display: none; }
          .brow__excerpt { display: none; }
        }
      `}</style>

      {/* ── Hero — same style as the /works book hero ── */}
      <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "var(--bg)", zIndex: 1 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 4vw",
          color: "#0a0a0a",
        }}>
          <div style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "rgba(10, 10, 10, 0.45)",
            marginBottom: "clamp(18px, 3vh, 32px)",
            fontWeight: 500,
            animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 100ms both",
          }}>
            — pokyh.studio / Blog —
          </div>
          <h1
            ref={headlineRef}
            suppressHydrationWarning
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 500,
              fontSize: "clamp(64px, 14vw, 180px)",
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
              margin: 0,
              color: "#0a0a0a",
              userSelect: "none",
            }}
          >
            <span className="blog-line" data-text={t("blog_heading")} style={{ display: "block" }}>
              {t("blog_heading")}
            </span>
          </h1>
          <p style={{
            marginTop: "clamp(20px, 3.5vh, 40px)",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "clamp(13px, 1.3vw, 18px)",
            fontWeight: 400,
            lineHeight: 1.9,
            color: "rgba(10, 10, 10, 0.5)",
            letterSpacing: "0.01em",
            maxWidth: 520,
            animation: "chIn 0.6s cubic-bezier(0.22,0.61,0.36,1) 900ms both",
          }}>
            {t("blog_subtitle")}
          </p>
        </div>

        <div aria-hidden="true" style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(40px, 9vh, 90px)",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 13,
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 9,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "rgba(10, 10, 10, 0.4)",
          fontWeight: 500,
          whiteSpace: "nowrap",
          animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 1400ms both",
        }}>
          <span style={{ display: "flex", alignItems: "center", animation: "heroMouse 2.2s ease-in-out infinite" }}>
            <svg viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="13" height="20">
              <rect x="1" y="1" width="12" height="20" rx="6" strokeWidth={1.4} />
              <line x1="7" y1="5" x2="7" y2="8.5" strokeWidth={1.6} />
            </svg>
          </span>
          {t("scroll")}
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
          {/* Search + sort toolbar */}
          {!loading && !error && blogs.length > 0 && (
            <div data-reveal className="btools">
              <div className="btools__search">
                <svg viewBox="0 0 24 24" className="btools__searchIcon" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("blog_search_placeholder")}
                  aria-label={t("blog_search_placeholder")}
                />
                {query && (
                  <button type="button" className="btools__clear" onClick={() => setQuery("")} aria-label={t("blog_clear_search")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                )}
              </div>

              <div className="btools__sorts" role="group" aria-label="Sort">
                {([
                  { id: "new" as SortMode, label: t("blog_sort_newest") },
                  { id: "views" as SortMode, label: t("blog_sort_popular") },
                  { id: "old" as SortMode, label: t("blog_sort_oldest") },
                ]).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`bpill${sort === s.id ? " bpill--on" : ""}`}
                    aria-pressed={sort === s.id}
                    onClick={() => setSort(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <span className="btools__count">
                {filtered.length} {t("blog_articles_label")}
              </span>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadBlogs} />
          ) : blogs.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div style={{ minHeight: "30vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 13, letterSpacing: "0.08em", color: "#666" }}>
                {t("blog_no_results")}
              </p>
              <button type="button" className="bpill" onClick={() => setQuery("")}>
                {t("blog_clear_search")}
              </button>
            </div>
          ) : (
            <>
              {featured && <FeaturedCard blog={featured} lang={langLc} />}

              {rest.length > 0 && (
                <div style={{ marginTop: featured ? "clamp(2.5rem,5vh,4rem)" : 0 }}>
                  {rest.map((blog, i) => (
                    <BlogRow key={blog.id} blog={blog} index={i + (featured ? 2 : 1)} lang={langLc} />
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
  if (!blog.image_url) return null
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={blog.image_url} alt={blog.image_alt ?? blog.title} loading="lazy" decoding="async" />
    </div>
  )
}

/* ── Featured (newest) post ───────────────────────────────────────── */

function FeaturedCard({ blog, lang }: { blog: Blog; lang: string }) {
  const t = useT()
  return (
    <article data-reveal>
      <a className={`bfeat${blog.image_url ? "" : " bfeat--noimg"}`} href={`/${lang}/blog/${blog.slug}`}>
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
      <a className={`brow${blog.image_url ? "" : " brow--noimg"}`} href={`/${lang}/blog/${blog.slug}`}>
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
