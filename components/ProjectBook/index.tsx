"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import {
  createBookScene,
  type BookProject,
  type BookSceneHandle,
  type PageInfo,
  type ZoomPayload,
} from "./bookScene"

interface Props {
  projects: BookProject[]
  emptyHeading?: string
  emptyBody?: string
}


export default function ProjectBook({
  projects,
  emptyHeading = "Projects coming soon.",
  emptyBody = "The next chapter is being written.",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<BookSceneHandle | null>(null)

  const [pageInfo, setPageInfo] = useState<PageInfo>({
    page: 0,
    total: Math.max(projects.length + 1, 1),
    label: "Cover",
  })
  const [zoom, setZoom] = useState<ZoomPayload | null>(null)
  const [ready, setReady] = useState(false)


  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || projects.length === 0) return

    let cancelled = false
    setReady(false)
    gsap.set(canvas, { opacity: 0, scale: 0.96, transformOrigin: "50% 50%" })

    createBookScene({
      canvas,
      projects,
      onZoomChange: (z) => { if (!cancelled) setZoom(z) },
      onPageChange: (info) => { if (!cancelled) setPageInfo(info) },
    }).then((handle) => {
      if (cancelled) { handle.destroy(); return }
      handleRef.current = handle
      setReady(true)
    })

    return () => {
      cancelled = true
      handleRef.current?.destroy()
      handleRef.current = null
    }
  }, [projects])

  // Book canvas reveal — runs once the scene is fully built.
  useEffect(() => {
    if (!ready || !canvasRef.current) return
    const tween = gsap.to(canvasRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1.15,
      ease: "power3.out",
      delay: 0.15,
    })
    return () => { tween.kill() }
  }, [ready])

  if (projects.length === 0) {
    return <EmptyState heading={emptyHeading} body={emptyBody} />
  }

  const introGone = pageInfo.page > 0 || !!zoom

  return (
    <section className="book-stage" aria-label="Project book" data-lenis-prevent>
      {/* Full-viewport 3D book canvas — always centred, never resized by the
          intro text, so the open spread is never clipped and the book never
          shifts when the text fades. */}
      <canvas ref={canvasRef} className="book-canvas" data-lenis-prevent style={{ opacity: 0 }} />

      {/* Intro text — overlaid on the left, fades out when the book opens. */}
      <div className="book-left">
        <IntroPanel visible={!introGone} />
      </div>

      <ProgressRail pageInfo={pageInfo} hidden={!!zoom || !ready} />
      <ScrollHint hidden={pageInfo.page > 0 || !!zoom || !ready} />

      <ProjectOverlay
        zoom={zoom}
        onClose={() => handleRef.current?.closeZoom()}
      />

      <style jsx>{`
        .book-stage {
          position: relative;
          width: 100%;
          height: 100vh;
          background: var(--bg, #e4e2dc);
          overflow: hidden;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #0a0a0a;
          -webkit-font-smoothing: antialiased;
        }
        .book-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          cursor: default;
        }

        /* Intro text — overlay that hugs the book's spine-side edge.
           The book's spine sits at the exact horizontal centre of the canvas,
           so the closed cover's LEFT edge is always at 50% of the viewport.
           Anchoring the text's right edge to 50% (minus a small gap) and
           right-aligning it makes the text sit directly beside the cover on
           every screen width — text + book read as one tight, centred pair.
           It never affects the book's layout, so the book stays perfectly
           still when the text fades on the first page turn. */
        .book-left {
          position: absolute;
          top: 0;
          left: 5vw;
          width: 46%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-right: clamp(16px, 2vw, 36px);
          box-sizing: border-box;
          z-index: 8;
          pointer-events: none;
        }

        @media (max-width: 860px) {
          .book-left {
            top: clamp(64px, 9vh, 100px);
            left: 0;
            right: 0;
            width: 100%;
            height: auto;
            padding: 0 32px;
            justify-content: flex-start;
          }
        }
      `}</style>
    </section>
  )
}

// ── Intro panel (left side, shown on cover) ───────────────────────
const INTRO_TITLE = "Works"
const INTRO_LINES = [
  "A book of our craft.",
  "Each project, a chapter —",
  "each click, a page turned.",
]
const INTRO_TAGLINE = "Read between the pixels."

function IntroPanel({ visible }: { visible: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const fadeTween = useRef<gsap.core.Tween | null>(null)
  const didMount = useRef(false)

  // Entrance animation (runs once on mount)
  useEffect(() => {
    if (!titleRef.current || !bodyRef.current) return
    const chars = titleRef.current.querySelectorAll<HTMLSpanElement>(".intro__ch")
    const lines = bodyRef.current.querySelectorAll<HTMLDivElement>(".intro__line")
    const targets = [...Array.from(chars), ...Array.from(lines)]

    gsap.set(targets, { opacity: 0, y: 24 })

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.to(chars, { opacity: 1, y: 0, duration: 1.0, stagger: 0.08 }, 0.05)
      .to(lines, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.55)

    return () => { tl.kill() }
  }, [])

  // Fade in/out as the user turns the cover
  useEffect(() => {
    if (!rootRef.current) return
    if (!didMount.current) {
      didMount.current = true
      return // first render: entrance animation handles initial state
    }
    fadeTween.current?.kill()
    fadeTween.current = gsap.to(rootRef.current, {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : -12,
      duration: visible ? 0.65 : 0.18,
      delay: visible ? 0.7 : 0,
      ease: visible ? "power2.out" : "power2.in",
    })
  }, [visible])

  return (
    <aside
      ref={rootRef}
      className="intro"
      aria-hidden={!visible}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <h2 ref={titleRef} className="intro__title" aria-label={INTRO_TITLE}>
        {INTRO_TITLE.split("").map((ch, i) => (
          <span key={i} className="intro__ch" aria-hidden="true">{ch}</span>
        ))}
      </h2>
      <div ref={bodyRef} className="intro__body">
        {INTRO_LINES.map((line, i) => (
          <div key={i} className="intro__line">{line}</div>
        ))}
        <div className="intro__line intro__line--quiet">{INTRO_TAGLINE}</div>
      </div>

      <style jsx>{`
        .intro {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #0a0a0a;
        }
        .intro__title {
          font-family: var(--font-inter), sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: clamp(48px, 7vw, 108px);
          line-height: 1.0;
          letter-spacing: -0.04em;
          margin: 0 0 20px;
          color: #0a0a0a;
          white-space: nowrap;
        }
        .intro__ch {
          display: inline-block;
          will-change: opacity, transform;
          opacity: 0;
        }
        .intro__body {
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(12px, 0.9vw, 15px);
          font-weight: 400;
          line-height: 1.8;
          color: rgba(10, 10, 10, 0.45);
          letter-spacing: 0em;
          text-align: center;
        }
        .intro__line { will-change: opacity, transform; opacity: 0; }
        .intro__line--quiet {
          margin-top: 10px;
          color: rgba(10, 10, 10, 0.28);
          font-style: italic;
        }

        @media (max-width: 860px) {
          .intro { align-items: flex-start; }
          .intro__title { font-size: clamp(40px, 10vw, 64px); }
          .intro__body { text-align: left; }
        }
      `}</style>
    </aside>
  )
}

// ── Progress rail (right side) ─────────────────────────────────────
function ProgressRail({ pageInfo, hidden }: { pageInfo: PageInfo; hidden: boolean }) {
  const pct = pageInfo.total > 0 ? (pageInfo.page / pageInfo.total) * 100 : 0
  return (
    <div className={`rail${hidden ? " rail--hidden" : ""}`} aria-hidden="true">
      <span className="rail__label rail__label--top">Start</span>
      <div className="rail__fill" style={{ height: `${pct}%` }} />
      <div className="rail__knob" style={{ top: `${pct}%` }} />
      <span className="rail__label rail__label--bot">End</span>

      <style jsx>{`
        .rail {
          position: absolute;
          right: 44px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 280px;
          background: rgba(10, 10, 10, 0.08);
          border-radius: 2px;
          z-index: 10;
          transition: opacity 0.5s ease;
        }
        .rail--hidden { opacity: 0; pointer-events: none; }
        .rail__fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          background: #0a0a0a;
          border-radius: 2px;
          transition: height 0.45s cubic-bezier(.2,.7,.2,1);
        }
        .rail__knob {
          position: absolute;
          left: 50%;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #0a0a0a;
          transform: translate(-50%, -50%);
          transition: top 0.45s cubic-bezier(.2,.7,.2,1);
        }
        .rail__label {
          position: absolute;
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.4);
          white-space: nowrap;
          font-weight: 500;
        }
        .rail__label--top { top: -22px; right: -2px; }
        .rail__label--bot { bottom: -22px; right: -4px; }
      `}</style>
    </div>
  )
}

// ── Scroll hint (bottom centre) ────────────────────────────────────
function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <div className={`hint${hidden ? " hint--hidden" : ""}`} aria-hidden="true">
      Scroll to turn the page
      <span className="hint__arrow">↓</span>

      <style jsx>{`
        .hint {
          position: absolute;
          left: 50%;
          bottom: 38px;
          transform: translateX(-50%);
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.4);
          z-index: 10;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: opacity 0.5s ease;
          font-weight: 500;
        }
        .hint--hidden { opacity: 0; pointer-events: none; }
        .hint__arrow {
          display: inline-block;
          animation: hintBob 1.8s ease-in-out infinite;
          font-size: 14px;
        }
        @keyframes hintBob {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50%      { transform: translateY(4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Project overlay (shown when a page is clicked) ─────────────────
function ProjectOverlay({ zoom, onClose }: { zoom: ZoomPayload | null; onClose: () => void }) {
  const show = !!zoom
  return (
    <>
      <div className={`detail${show ? " detail--show" : ""}`} role={show ? "dialog" : undefined} aria-modal={show || undefined}>
        <div className="detail__inner">
          <div className="detail__eyebrow">{zoom?.eyebrow ?? ""}</div>
          <h2 className="detail__title">{zoom?.title ?? ""}</h2>
          <div className="detail__rule" />
          <p className="detail__body">{zoom?.body ?? ""}</p>
          {zoom?.tags && zoom.tags.length > 0 && (
            <div className="detail__tags">
              {zoom.tags.map((tag) => (
                <span key={tag} className="detail__tag">{tag}</span>
              ))}
            </div>
          )}
          <div className="detail__meta">
            {zoom?.year && <span>{zoom.year}</span>}
            {zoom?.status && <span>{zoom.status.toUpperCase()}</span>}
            {zoom?.url && (
              <a href={zoom.url} target="_blank" rel="noopener noreferrer" className="detail__link">
                Visit project ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <button type="button" className={`back${show ? " back--show" : ""}`} onClick={onClose} aria-label="Close project">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <style jsx>{`
        .detail {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5vw;
          pointer-events: none;
          background: rgba(255, 255, 255, 0);
          transition: background 0.7s cubic-bezier(.4,0,.2,1);
        }
        .detail--show {
          background: rgba(255, 255, 255, 0.92);
          pointer-events: auto;
        }
        .detail__inner {
          max-width: 720px;
          text-align: center;
          opacity: 0;
          transform: translateY(22px) scale(0.96);
          transition:
            opacity 0.6s cubic-bezier(.4,0,.2,1),
            transform 0.75s cubic-bezier(.2,.8,.2,1);
        }
        .detail--show .detail__inner {
          opacity: 1;
          transform: translateY(0) scale(1);
          transition-delay: 0.35s;
        }
        .detail__eyebrow {
          font-size: 11px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.4);
          margin-bottom: 28px;
          font-weight: 500;
        }
        .detail__title {
          font-family: var(--font-inter), sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: clamp(40px, 6vw, 86px);
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: #0a0a0a;
          margin: 0;
        }
        .detail__rule {
          width: 80px; height: 1px;
          background: rgba(10, 10, 10, 0.25);
          margin: 36px auto 28px;
        }
        .detail__body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(14px, 1.2vw, 17px);
          color: rgba(10, 10, 10, 0.65);
          line-height: 1.75;
          letter-spacing: 0;
          margin: 0 auto;
          max-width: 560px;
        }
        .detail__tags {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .detail__tag {
          font-family: "Inter", sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(10, 10, 10, 0.2);
          color: rgba(10, 10, 10, 0.65);
          text-transform: uppercase;
        }
        .detail__meta {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 18px;
          font-family: "Inter", sans-serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.55);
        }
        .detail__link {
          color: #644BFF;
          text-decoration: none;
          font-weight: 500;
        }
        .detail__link:hover { text-decoration: underline; }

        .back {
          position: absolute;
          top: 32px;
          left: 32px;
          z-index: 30;
          background: rgba(10, 10, 10, 0.94);
          color: #fff;
          border: none;
          padding: 13px 22px 13px 16px;
          border-radius: 999px;
          font: 500 11px/1 "Inter", system-ui, sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transform: translateY(-12px);
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.45s cubic-bezier(.4,0,.2,1),
            transform 0.55s cubic-bezier(.2,.8,.2,1),
            background 0.2s ease;
        }
        .back--show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
          transition-delay: 0.45s;
        }
        .back:hover { background: #000; }
        .back svg { width: 14px; height: 14px; }
      `}</style>
    </>
  )
}

// ── Empty state ────────────────────────────────────────────────────
function EmptyState({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="empty">
      <div className="empty__inner">
        <div className="empty__eyebrow">— Pokyh —</div>
        <h2 className="empty__title">{heading}</h2>
        <p className="empty__body">{body}</p>
      </div>

      <style jsx>{`
        .empty {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg, #e4e2dc);
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .empty__inner { text-align: center; max-width: 520px; padding: 0 5vw; }
        .empty__eyebrow {
          font-size: 11px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.4);
          margin-bottom: 28px;
          font-weight: 500;
        }
        .empty__title {
          font-family: var(--font-inter), sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: clamp(40px, 6vw, 72px);
          color: #0a0a0a;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
          line-height: 1.0;
        }
        .empty__body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 16px;
          color: rgba(10, 10, 10, 0.55);
          line-height: 1.7;
          margin: 0;
        }
      `}</style>
    </section>
  )
}
