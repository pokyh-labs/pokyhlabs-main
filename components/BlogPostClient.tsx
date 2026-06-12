"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useLanguage, useT } from "@/lib/i18n/context"

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
  alternates?: { de: string | null; en: string | null; it: string | null }
}

// Same solid background as the project detail view (warm off-white).
const DETAIL_BG = "#f4f1ea"

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPostClient({ blog }: { blog: BlogPost }) {
  const { lang, setAlternates } = useLanguage()
  const t = useT()
  const [views, setViews] = useState(blog.views)
  const rootRef = useRef<HTMLElement>(null)

  const dateLocale = ({ DE: "de-DE", EN: "en-GB", IT: "it-IT" } as const)[lang]

  useEffect(() => {
    if (blog.alternates) {
      const alts: Record<string, string> = {}
      if (blog.alternates.de) alts.de = blog.alternates.de
      if (blog.alternates.en) alts.en = blog.alternates.en
      if (blog.alternates.it) alts.it = blog.alternates.it
      setAlternates(alts)
    }
    return () => {
      setAlternates(null)
    }
  }, [blog.alternates, setAlternates])

  useEffect(() => {
    fetch(`/api/blogs/${blog.slug}/view`, { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.views != null) setViews(data.views) })
      .catch(() => {})
  }, [blog.slug])

  // Reading progress — drives the top sliver via CSS var (no re-renders).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      el.style.setProperty("--read-progress", String(p))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const hasImage = !!blog.image_url

  return (
    <article ref={rootRef} className="bp" style={{ backgroundColor: DETAIL_BG }}>
      {/* Reading progress sliver. */}
      <div className="bp__progress" aria-hidden="true"><div className="bp__progressFill" /></div>

      {/* Hero band — pure typographic, sets the stage. */}
      <header className="bp__hero">
        <div className="bp__heroBody">
          <div className="bp__eyebrow">Blog</div>
          <h1 className="bp__title">{blog.title}</h1>
          <div className="bp__metaStrip">
            <span className="bp__metaItem">{formatDate(blog.published_at, dateLocale)}</span>
            {blog.author && <span className="bp__metaItem">{blog.author.username}</span>}
            <span className="bp__metaItem">{views} {t("blog_views_suffix")}</span>
          </div>
        </div>
      </header>

      {/* Feature band — image NEXT TO text on desktop, stacked on mobile. */}
      <section className={`bp__feature${hasImage ? "" : " bp__feature--noimg"}`}>
        {hasImage && (
          <figure className="bp__featureMedia">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.image_url!}
              alt={blog.image_alt ?? blog.title}
              loading="eager"
              decoding="async"
            />
          </figure>
        )}

        <div className="bp__featureBody">
          {blog.excerpt && <p className="bp__lead">{blog.excerpt}</p>}

          <div className="bp__body blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />

          <Link href={`/${lang.toLowerCase()}/blog`} className="bp__cta">
            <span>{t("blog_more_articles")}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Bottom spacer — keeps the last content clear of the fixed back button. */}
      <div className="bp__footnote" aria-hidden="true" />

      {/* Back button (fixed bottom-right, same as the project view). */}
      <Link href={`/${lang.toLowerCase()}/blog`} className="bp__back" aria-label={t("blog_back_to_list")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("works_back")}
      </Link>

      <style>{`
        .bp {
          min-height: 100vh;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          --read-progress: 0;
        }

        /* Reading-progress sliver (CSS-var driven, no React work per frame). */
        .bp__progress {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: rgba(28, 20, 10, 0.08);
          z-index: 50;
          pointer-events: none;
        }
        .bp__progressFill {
          width: 100%;
          height: 100%;
          background: #644BFF;
          transform-origin: 0 50%;
          transform: scaleX(var(--read-progress, 0));
          will-change: transform;
        }

        @keyframes bpIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Hero (typographic only) ─────────────────────────── */
        .bp__hero {
          width: 100%;
          padding: clamp(110px, 16vh, 170px) clamp(24px, 6vw, 100px) clamp(36px, 5vh, 60px);
          box-sizing: border-box;
          animation: bpIn 0.75s cubic-bezier(.2,.8,.2,1) 0.1s both;
        }
        .bp__heroBody {
          max-width: 1080px;
          margin: 0 auto;
        }
        .bp__eyebrow {
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(10px, 1vw, 12px);
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgba(40, 28, 8, 0.5);
          margin-bottom: clamp(16px, 2.4vh, 28px);
          font-weight: 600;
        }
        .bp__title {
          font-family: var(--font-inter), sans-serif;
          font-weight: 600;
          font-size: clamp(40px, 7vw, 104px);
          line-height: 0.96;
          letter-spacing: -0.04em;
          color: #1c140a;
          margin: 0;
          overflow-wrap: anywhere;
        }
        .bp__metaStrip {
          margin-top: clamp(18px, 2.6vh, 30px);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 22px;
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(10px, 0.95vw, 12px);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(28, 20, 10, 0.5);
          font-weight: 500;
        }
        .bp__metaItem { position: relative; display: inline-flex; align-items: center; gap: 8px; }
        .bp__metaItem + .bp__metaItem::before {
          content: "";
          position: absolute;
          left: -12px; top: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
          transform: translateY(-50%);
        }

        /* ── Feature band — image NEXT TO text on desktop ────── */
        .bp__feature {
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(20px, 3vh, 36px) clamp(24px, 6vw, 100px) clamp(40px, 6vh, 72px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: clamp(28px, 5vw, 72px);
          align-items: start;
          animation: bpIn 0.85s cubic-bezier(.2,.8,.2,1) 0.22s both;
        }
        .bp__feature--noimg {
          grid-template-columns: minmax(0, 720px);
          justify-content: center;
        }

        /* Sticky media so long text reads beside a steady image. */
        .bp__featureMedia {
          position: sticky;
          top: clamp(28px, 4vh, 56px);
          margin: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #e7dfcd;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.6) inset,
            0 32px 64px -28px rgba(40, 28, 8, 0.45);
          border: 1px solid rgba(40, 28, 8, 0.1);
          aspect-ratio: 4 / 3;
        }
        .bp__featureMedia img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bp__featureBody { min-width: 0; }

        .bp__lead {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(17px, 1.35vw, 21px);
          color: rgba(28, 20, 10, 0.6);
          line-height: 1.65;
          margin: 0 0 clamp(22px, 3.4vh, 38px);
          letter-spacing: 0.003em;
        }

        /* ── Body / article content (same type as the project view) ── */
        .bp__body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(15px, 1.1vw, 18px);
          color: rgba(28, 20, 10, 0.82);
          line-height: 1.75;
          letter-spacing: 0.003em;
          overflow-wrap: break-word;
        }
        .blog-content h1, .blog-content h2, .blog-content h3,
        .blog-content h4, .blog-content h5, .blog-content h6 {
          font-family: var(--font-inter), sans-serif;
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 2.5rem 0 1rem;
          color: #1c140a;
        }
        .blog-content h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); }
        .blog-content h2 { font-size: clamp(1.4rem, 2.5vw, 1.9rem); }
        .blog-content h3 { font-size: clamp(1.1rem, 2vw, 1.4rem); }
        .blog-content p { margin: 1.25rem 0; }
        .blog-content p:first-child { margin-top: 0; }
        .blog-content a { color: #644BFF; text-underline-offset: 3px; }
        .blog-content a:hover { opacity: 0.7; }
        .blog-content ul, .blog-content ol {
          padding-left: 1.5rem;
          margin: 1.25rem 0;
        }
        .blog-content li { margin: 0.4rem 0; }
        .blog-content blockquote {
          border-left: 3px solid #644BFF;
          padding: 0.5rem 0 0.5rem 1.5rem;
          margin: 1.5rem 0;
          color: rgba(28, 20, 10, 0.6);
          font-style: italic;
        }
        .blog-content code {
          background: rgba(28, 20, 10, 0.07);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: var(--font-dm-mono), monospace;
          color: #1c140a;
        }
        .blog-content pre {
          background: rgba(28, 20, 10, 0.05);
          border: 1px solid rgba(28, 20, 10, 0.1);
          border-radius: 8px;
          padding: 1.25rem 1.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .blog-content pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
          color: #1c140a;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          border: 1px solid rgba(40, 28, 8, 0.1);
          box-shadow: 0 12px 30px -22px rgba(40, 28, 8, 0.4);
          margin: 1.5rem 0;
          display: block;
        }
        .blog-content figure {
          margin: 1.5rem 0;
          text-align: center;
        }
        .blog-content figcaption {
          font-size: 0.8rem;
          color: rgba(28, 20, 10, 0.45);
          margin-top: 0.5rem;
          font-family: var(--font-inter), sans-serif;
          letter-spacing: 0.05em;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(28, 20, 10, 0.12);
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
          border: 1px solid rgba(28, 20, 10, 0.12);
          text-align: left;
        }
        .blog-content th {
          background: rgba(28, 20, 10, 0.05);
          color: #1c140a;
          font-weight: 600;
          font-family: var(--font-inter), sans-serif;
        }
        .blog-content td { color: rgba(28, 20, 10, 0.7); }
        .blog-content strong { color: #1c140a; font-weight: 600; }
        .blog-content em { color: rgba(28, 20, 10, 0.75); }

        /* ── CTA (same black pill as the project view) ───────── */
        .bp__cta {
          margin-top: clamp(32px, 5vh, 52px);
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #0a0a0a;
          color: #fff;
          text-decoration: none;
          padding: 14px 24px;
          border-radius: 999px;
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s ease;
          box-shadow: 0 10px 30px -16px rgba(100, 75, 255, 0.5);
        }
        .bp__cta::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, #644BFF 0%, #8a72ff 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .bp__cta > * { position: relative; z-index: 1; }
        .bp__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -16px rgba(100, 75, 255, 0.6);
        }
        .bp__cta:hover::before { opacity: 1; }
        .bp__cta svg { width: 15px; height: 15px; transition: transform 0.25s ease; }
        .bp__cta:hover svg { transform: translate(2px, -2px); }

        /* Bottom spacer — keeps the last content clear of the fixed back button. */
        .bp__footnote {
          height: clamp(80px, 12vh, 140px);
        }

        /* ── Back button (fixed bottom-right, same as the project view) ── */
        .bp__back {
          position: fixed;
          bottom: clamp(20px, 4vh, 40px);
          right: clamp(16px, 4vw, 44px);
          z-index: 30;
          background: #0a0a0a;
          color: #fff;
          border: none;
          padding: 12px 22px 12px 16px;
          border-radius: 999px;
          font: 600 11px/1 var(--font-inter), system-ui, sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s ease, transform 0.2s ease;
          box-shadow: 0 12px 30px -14px rgba(0,0,0,0.5);
        }
        .bp__back:hover { background: #000; transform: translateY(-1px); }
        .bp__back svg { width: 14px; height: 14px; }

        /* ── Responsive: stack feature + smaller type on mobile ─ */
        @media (max-width: 860px) {
          .bp__feature {
            grid-template-columns: 1fr;
            gap: clamp(20px, 4vh, 32px);
            padding-left: clamp(20px, 5vw, 36px);
            padding-right: clamp(20px, 5vw, 36px);
          }
          .bp__featureMedia {
            position: static;
            aspect-ratio: 16 / 11;
          }
        }
        @media (max-width: 640px) {
          .bp__hero { padding: clamp(96px, 14vh, 120px) 20px clamp(20px, 3vh, 32px); }
          .bp__title { font-size: clamp(36px, 11vw, 56px); letter-spacing: -0.035em; }
          .bp__metaStrip { gap: 8px 16px; font-size: 10px; }
          .bp__feature { padding: 16px 20px 32px; }
          .bp__body { font-size: 15px; line-height: 1.7; }
          .bp__lead { font-size: 16px; }
          .bp__cta { padding: 13px 22px; font-size: 12px; }
          .bp__footnote { height: 96px; }
          .bp__back { font-size: 10px; padding: 10px 18px 10px 14px; letter-spacing: 1.6px; }
          .bp__back svg { width: 12px; height: 12px; }
        }
      `}</style>
    </article>
  )
}
