"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  createBookScene,
  type BookProject,
  type BookSceneHandle,
  type PageInfo,
  type ZoomPayload,
} from "./bookScene"

gsap.registerPlugin(ScrollTrigger)

interface Props {
  projects: BookProject[]
  emptyHeading?: string
  emptyBody?: string
}

// Scroll budget (in viewport heights) for each phase of the experience.
const HERO_VH = 85       // hero visible → book flies in
const PER_PAGE_VH = 62   // scroll distance per page turn
const EXIT_VH = 75       // book recedes → footer handoff

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// smootherstep — eases the text push in and out so it feels shoved, not linear
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

// Clean solid background for the project detail view (warm off-white, no texture).
const DETAIL_BG = "#f4f1ea"

type Lenis = {
  stop: () => void
  start: () => void
  scrollTo: (
    target: number,
    opts?: { duration?: number; lock?: boolean; easing?: (t: number) => number; onComplete?: () => void },
  ) => void
  on: (event: string, cb: () => void) => void
  off: (event: string, cb: () => void) => void
}
const getLenis = (): Lenis | null =>
  (window as unknown as { __lenis?: Lenis }).__lenis ?? null

export default function ProjectBook({
  projects,
  emptyHeading = "Projects coming soon.",
  emptyBody = "The next chapter is being written.",
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<BookSceneHandle | null>(null)
  const phaseRef = useRef<"hero" | "book" | "exit">("hero")
  const zoomRef = useRef(false)
  const snappingRef = useRef(false)
  const lastSettledRef = useRef(0)

  const [pageInfo, setPageInfo] = useState<PageInfo>({
    page: 0,
    total: Math.max(projects.length + 1, 1),
    label: "Cover",
  })
  const [zoom, setZoom] = useState<ZoomPayload | null>(null)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<"hero" | "book" | "exit">("hero")

  const maxPage = projects.length + 1
  // Scroll geometry shared by every effect below: progress fractions where the
  // entrance ends (cover) and the page phase ends (back cover).
  const pagesVh = maxPage * PER_PAGE_VH
  const scrollVh = HERO_VH + pagesVh + EXIT_VH
  const eEnd = HERO_VH / scrollVh
  const pEnd = (HERO_VH + pagesVh) / scrollVh

  // Keep a ref of the zoom state for use inside imperative scroll handlers.
  useEffect(() => { zoomRef.current = !!zoom }, [zoom])

  // ── Build the 3D scene ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || projects.length === 0) return

    let cancelled = false
    setReady(false)

    // Hold the page at the hero while the scene (model + textures) builds, so a
    // scroll during loading can't desync the entrance. Released once ready, with
    // a safety timeout so the page never stays locked if the build stalls.
    getLenis()?.stop()
    const safety = setTimeout(() => getLenis()?.start(), 6000)

    createBookScene({
      canvas,
      projects,
      onZoomChange: (z) => {
        if (cancelled) return
        setZoom(z)
        // Freeze the page while a project is open so scrolling doesn't turn
        // pages or move the pinned stage behind the overlay.
        const lenis = getLenis()
        if (z) lenis?.stop()
        else lenis?.start()
      },
      onPageChange: (info) => { if (!cancelled) setPageInfo(info) },
    }).then((handle) => {
      if (cancelled) { handle.destroy(); return }
      handleRef.current = handle
      setReady(true)
      clearTimeout(safety)
      getLenis()?.start()
    })

    return () => {
      cancelled = true
      clearTimeout(safety)
      getLenis()?.start()
      handleRef.current?.destroy()
      handleRef.current = null
    }
  }, [projects])

  // Reveal the canvas only once the scene is fully built — avoids the book/
  // textures flashing in while still loading.
  useEffect(() => {
    if (!ready || !canvasRef.current) return
    const tween = gsap.to(canvasRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" })
    return () => { tween.kill() }
  }, [ready])

  // ── Drive entrance + page turns from the scroll position ────────
  useEffect(() => {
    if (!ready) return
    const section = sectionRef.current
    const handle = handleRef.current
    if (!section || !handle) return

    const setPhase_ = (p: "hero" | "book" | "exit") => {
      if (phaseRef.current === p) return
      phaseRef.current = p
      setPhase(p)
    }

    const apply = (p: number) => {
      const entranceT = clamp01(p / eEnd)
      handle.setEntrance(entranceT)

      // Hero text: holds briefly, then gets shoved up and off the top as the
      // rising book pushes it away — the same directional push as the site
      // header on scroll. Reverses on scroll-up since it's progress-driven.
      const hero = heroRef.current
      if (hero) {
        const push = smoother(clamp01((entranceT - 0.1) / 0.9))
        hero.style.opacity = String(1 - clamp01(push * 1.15))
        hero.style.transform = `translate3d(0, ${-push * 72}vh, 0) scale(${1 - push * 0.04})`
      }

      // The book stays fully visible throughout — at the end it just shrinks a
      // touch as it recedes toward the footer (no fade-out).
      let canvasScale = 1

      if (p < eEnd) {
        setPhase_("hero")
        handle.setInteractive(false)
        handle.goToPage(0)
      } else if (p <= pEnd) {
        setPhase_("book")
        handle.setInteractive(true)
        const pageT = (p - eEnd) / (pEnd - eEnd)
        handle.goToPage(Math.round(pageT * maxPage))
      } else {
        setPhase_("exit")
        handle.setInteractive(false)
        handle.goToPage(maxPage)
        const exitT = clamp01((p - pEnd) / (1 - pEnd))
        canvasScale = lerp(1, 0.9, exitT)
      }

      const canvas = canvasRef.current
      if (canvas) {
        canvas.style.transform = `scale(${canvasScale})`
      }
    }

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
    })

    apply(st.progress)
    ScrollTrigger.refresh()

    return () => { st.kill() }
  }, [ready, maxPage, eEnd, pEnd])

  // ── Keyboard / horizontal paging + snap that catches at the covers ──
  useEffect(() => {
    if (!ready) return
    const section = sectionRef.current
    const lenis = getLenis()
    if (!section || !lenis) return

    const metrics = () => {
      const absTop = section.getBoundingClientRect().top + window.scrollY
      const L = Math.max(1, section.offsetHeight - window.innerHeight)
      return { absTop, L }
    }
    const progressForY = (y: number, m: { absTop: number; L: number }) => clamp01((y - m.absTop) / m.L)
    const yForProgress = (p: number, m: { absTop: number; L: number }) => m.absTop + p * m.L
    const pageProgress = (k: number) => eEnd + (k / maxPage) * (pEnd - eEnd)

    lastSettledRef.current = progressForY(window.scrollY, metrics())

    const animateTo = (yPx: number) => {
      snappingRef.current = true
      const done = () => { snappingRef.current = false }
      lenis.scrollTo(yPx, { duration: 0.6, lock: true, onComplete: done })
      setTimeout(done, 800) // safety in case the tween is interrupted
    }

    // Jump to the page `dir` away from the current spread (stays within the book).
    const flipPage = (dir: number) => {
      if (zoomRef.current) return
      const m = metrics()
      const p = progressForY(window.scrollY, m)
      const cur = Math.round(((p - eEnd) / (pEnd - eEnd)) * maxPage)
      const next = Math.min(maxPage, Math.max(0, cur + dir))
      const tp = pageProgress(next)
      lastSettledRef.current = tp
      animateTo(yForProgress(tp, m))
    }

    const onKey = (e: KeyboardEvent) => {
      if (zoomRef.current) return
      const m = metrics()
      if (window.scrollY >= m.absTop + m.L - 1) return // in footer — leave native
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault(); flipPage(1)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault(); flipPage(-1)
      }
    }

    // Horizontal trackpad / wheel → page flip (debounced so one swipe = one page).
    let hAccum = 0
    let hCooldown = false
    const onWheel = (e: WheelEvent) => {
      if (zoomRef.current) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 6) {
        e.preventDefault() // also blocks the browser's swipe-to-go-back
        if (hCooldown) return
        hAccum += e.deltaX
        if (Math.abs(hAccum) > 40) {
          const dir = hAccum > 0 ? 1 : -1
          hAccum = 0
          hCooldown = true
          flipPage(dir)
          setTimeout(() => { hCooldown = false }, 450)
        }
      }
    }

    // After scrolling settles: keep free movement *inside* the book, but snap
    // the entrance/exit, and — crucially — catch a fast flick at the cover
    // (going up) or back cover (going down) so it can't fly to the hero/footer
    // in one motion. Leaving the book then takes a second deliberate scroll.
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    const settle = () => {
      if (snappingRef.current || zoomRef.current) return
      const m = metrics()
      const y = window.scrollY
      const p = progressForY(y, m)
      const eps = 1e-3
      if (p > eEnd + eps && p < pEnd - eps) { lastSettledRef.current = p; return } // free in book
      const wasInBook = lastSettledRef.current > eEnd + eps && lastSettledRef.current < pEnd - eps
      let target: number
      if (p <= eEnd + eps) {
        target = wasInBook ? eEnd : p < eEnd * 0.5 ? 0 : eEnd
      } else {
        if (y >= m.absTop + m.L - 1 && !wasInBook) { lastSettledRef.current = 1; return } // free footer
        target = wasInBook ? pEnd : p > (pEnd + 1) * 0.5 ? 1 : pEnd
      }
      if (Math.abs(target - p) < 1.5e-3) { lastSettledRef.current = target; return }
      lastSettledRef.current = target
      animateTo(yForProgress(target, m))
    }
    const onScroll = () => {
      if (snappingRef.current || zoomRef.current) return
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, 110)
    }

    window.addEventListener("keydown", onKey)
    window.addEventListener("wheel", onWheel, { passive: false })
    lenis.on("scroll", onScroll)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("wheel", onWheel)
      lenis.off("scroll", onScroll)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [ready, maxPage, eEnd, pEnd])

  if (projects.length === 0) {
    return <EmptyState heading={emptyHeading} body={emptyBody} />
  }

  return (
    <section
      ref={sectionRef}
      className="book-section"
      aria-label="Project book"
      style={{ minHeight: `calc(100vh + ${scrollVh}vh)` }}
    >
      <div ref={stageRef} className="book-stage">
        {/* 3D book canvas — fades in once the scene is built so the model/textures
            never pop in mid-load; the book itself then slides up into frame. */}
        <canvas ref={canvasRef} className="book-canvas" style={{ opacity: 0 }} />

        {/* Hero text — first thing on screen, lifts away as the book arrives. */}
        <Hero ref={heroRef} />

        <ProgressRail pageInfo={pageInfo} hidden={phase !== "book" || !!zoom || !ready} />

        <ProjectOverlay zoom={zoom} onClose={() => handleRef.current?.closeZoom()} />
      </div>

      <style jsx>{`
        .book-section {
          position: relative;
          width: 100%;
          background: var(--bg, #e4e2dc);
        }
        .book-stage {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: var(--bg, #e4e2dc);
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
          transform-origin: 50% 50%;
          will-change: transform;
        }
      `}</style>
    </section>
  )
}

// ── Hero (top of page) ─────────────────────────────────────────────
const HERO_TITLE = "Works"
const HERO_LINES = [
  "A book of our craft.",
  "Each project a chapter —",
  "each scroll, a page turned.",
]

const Hero = forwardRef<HTMLDivElement>(function Hero(_props, ref) {
    const titleRef = useRef<HTMLHeadingElement>(null)
    const bodyRef = useRef<HTMLDivElement>(null)

    // One-shot entrance animation on mount.
    useEffect(() => {
      if (!titleRef.current || !bodyRef.current) return
      const chars = titleRef.current.querySelectorAll<HTMLSpanElement>(".hero__ch")
      const lines = bodyRef.current.querySelectorAll<HTMLDivElement>(".hero__line")
      gsap.set([...Array.from(chars), ...Array.from(lines)], { opacity: 0, y: 28 })
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.to(chars, { opacity: 1, y: 0, duration: 1.0, stagger: 0.06 }, 0.1)
        .to(lines, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.5)
      return () => { tl.kill() }
    }, [])

    return (
      <div ref={ref} className="hero" aria-hidden="false">
        <div className="hero__inner">
          <div className="hero__eyebrow">— A collection by Pokyh Labs —</div>
          <h1 ref={titleRef} className="hero__title" aria-label={HERO_TITLE}>
            {HERO_TITLE.split("").map((ch, i) => (
              <span key={i} className="hero__ch" aria-hidden="true">{ch}</span>
            ))}
          </h1>
          <div ref={bodyRef} className="hero__body">
            {HERO_LINES.map((line, i) => (
              <div key={i} className="hero__line">{line}</div>
            ))}
          </div>
        </div>

        <div className="hero__cue" aria-hidden="true">
          <span className="hero__mouse">
            <svg viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="13" height="20">
              <rect x="1" y="1" width="12" height="20" rx="6" strokeWidth={1.4} />
              <line x1="7" y1="5" x2="7" y2="8.5" strokeWidth={1.6} />
            </svg>
          </span>
          Scroll to open the book
        </div>

        <style jsx>{`
          .hero {
            position: absolute;
            inset: 0;
            z-index: 8;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            pointer-events: none;
            will-change: opacity, transform;
            color: #0a0a0a;
          }
          .hero__inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: min(90vw, 760px);
          }
          .hero__eyebrow {
            font-family: var(--font-inter), sans-serif;
            font-size: clamp(10px, 1vw, 12px);
            letter-spacing: 0.42em;
            text-transform: uppercase;
            color: rgba(10, 10, 10, 0.45);
            margin-bottom: clamp(18px, 3vh, 32px);
            font-weight: 500;
          }
          .hero__title {
            font-family: var(--font-inter), sans-serif;
            font-weight: 500;
            font-size: clamp(64px, 14vw, 180px);
            line-height: 0.92;
            letter-spacing: -0.05em;
            margin: 0;
            color: #0a0a0a;
          }
          .hero__ch { display: inline-block; will-change: opacity, transform; }
          .hero__body {
            margin-top: clamp(20px, 3.5vh, 40px);
            font-family: var(--font-inter), sans-serif;
            font-size: clamp(13px, 1.3vw, 18px);
            font-weight: 400;
            line-height: 1.9;
            color: rgba(10, 10, 10, 0.5);
            letter-spacing: 0.01em;
          }
          .hero__line { will-change: opacity, transform; }

          .hero__cue {
            position: absolute;
            left: 50%;
            bottom: clamp(40px, 9vh, 90px);
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 13px;
            font-family: var(--font-inter), sans-serif;
            font-size: 9px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: rgba(10, 10, 10, 0.4);
            font-weight: 500;
            white-space: nowrap;
          }
          .hero__mouse {
            display: flex;
            align-items: center;
            animation: heroMouse 2.2s ease-in-out infinite;
          }
          @keyframes heroMouse {
            0%, 100% { opacity: 0.45; transform: translateY(0); }
            50%      { opacity: 0.9; transform: translateY(3px); }
          }

          @media (max-width: 600px) {
            .hero__cue { font-size: 8px; letter-spacing: 3px; }
          }
        `}</style>
      </div>
    )
})

// ── Progress rail (right side) ─────────────────────────────────────
function ProgressRail({ pageInfo, hidden }: { pageInfo: PageInfo; hidden: boolean }) {
  const pct = pageInfo.total > 0 ? (pageInfo.page / pageInfo.total) * 100 : 0
  const currentNum = String(pageInfo.page).padStart(2, "0")
  const totalNum = String(pageInfo.total).padStart(2, "0")
  return (
    <div className={`rail${hidden ? " rail--hidden" : ""}`} aria-hidden="true">
      <span className="rail__num rail__num--top">01</span>
      <div className="rail__fill" style={{ height: `${pct}%` }} />
      <div className="rail__knob" style={{ top: `${pct}%` }}>
        <span className="rail__current">{currentNum}</span>
      </div>
      <span className="rail__num rail__num--bot">{totalNum}</span>

      <style jsx>{`
        .rail {
          position: absolute;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 260px;
          background: rgba(10, 10, 10, 0.1);
          border-radius: 1px;
          z-index: 10;
          transition: opacity 0.5s ease;
        }
        .rail--hidden { opacity: 0; pointer-events: none; }
        .rail__fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          background: #0a0a0a;
          border-radius: 1px;
          transition: height 0.5s cubic-bezier(.2,.8,.2,1);
        }
        .rail__knob {
          position: absolute;
          left: 50%;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #0a0a0a;
          transform: translate(-50%, -50%);
          transition: top 0.5s cubic-bezier(.2,.8,.2,1);
        }
        .rail__current {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 9px;
          letter-spacing: 1.5px;
          color: rgba(10, 10, 10, 0.7);
          font-weight: 600;
          white-space: nowrap;
          font-family: var(--font-inter), sans-serif;
          transition: opacity 0.3s ease;
        }
        .rail__num {
          position: absolute;
          font-size: 8px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(10, 10, 10, 0.3);
          white-space: nowrap;
          font-weight: 500;
          font-family: var(--font-inter), sans-serif;
          right: 7px;
        }
        .rail__num--top { top: -20px; }
        .rail__num--bot { bottom: -20px; }

        @media (max-width: 600px) {
          .rail { right: 18px; height: 180px; }
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
      <div
        className={`detail${show ? " detail--show" : ""}`}
        role={show ? "dialog" : undefined}
        aria-modal={show || undefined}
        data-lenis-prevent
        style={{ backgroundColor: DETAIL_BG }}
      >
        <div className="detail__scroll">
          <article className={`detail__inner${zoom?.imageUrl ? "" : " detail__inner--noimg"}`}>
            {zoom?.imageUrl && (
              <figure className="detail__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={zoom.imageUrl} alt={zoom.title} />
              </figure>
            )}

            <div className="detail__content">
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
                {zoom?.year && <span className="detail__metaItem">{zoom.year}</span>}
                {zoom?.status && <span className="detail__metaItem">{zoom.status.toUpperCase()}</span>}
              </div>

              {zoom?.url && (
                <a href={zoom.url} target="_blank" rel="noopener noreferrer" className="detail__cta">
                  Visit project
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              )}
            </div>
          </article>
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
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.55s cubic-bezier(.4,0,.2,1);
        }
        .detail--show {
          opacity: 1;
          pointer-events: auto;
        }
        .detail__scroll {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(96px, 12vh, 160px) clamp(28px, 6vw, 110px) clamp(120px, 16vh, 180px);
          box-sizing: border-box;
        }
        .detail__inner {
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          align-items: center;
          gap: clamp(36px, 5vw, 88px);
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity 0.6s cubic-bezier(.4,0,.2,1),
            transform 0.75s cubic-bezier(.2,.8,.2,1);
        }
        .detail--show .detail__inner {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.18s;
        }

        .detail__media {
          margin: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #e7dfcd;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.6) inset,
            0 30px 60px -28px rgba(40, 28, 8, 0.45);
          border: 1px solid rgba(40, 28, 8, 0.1);
        }
        .detail__media img {
          display: block;
          width: 100%;
          height: 100%;
          max-height: 70vh;
          object-fit: cover;
          aspect-ratio: 4 / 3;
        }

        .detail__content { min-width: 0; }
        .detail__eyebrow {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(40, 28, 8, 0.45);
          margin-bottom: 18px;
          font-weight: 600;
        }
        .detail__title {
          font-family: var(--font-inter), sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4.6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #1c140a;
          margin: 0;
        }
        .detail__rule {
          width: 56px; height: 2px;
          background: #644BFF;
          margin: 24px 0 22px;
          border-radius: 2px;
        }
        .detail__body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(15px, 1.15vw, 18px);
          color: rgba(28, 20, 10, 0.78);
          line-height: 1.7;
          margin: 0;
          max-width: 52ch;
        }
        .detail__tags {
          margin-top: 26px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .detail__tag {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid rgba(40, 28, 8, 0.22);
          color: rgba(28, 20, 10, 0.7);
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.35);
        }
        .detail__meta {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px 22px;
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(28, 20, 10, 0.5);
        }
        .detail__metaItem { position: relative; }
        .detail__metaItem + .detail__metaItem::before {
          content: "";
          position: absolute;
          left: -12px; top: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(28, 20, 10, 0.35);
          transform: translateY(-50%);
        }
        .detail__cta {
          margin-top: 30px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #644BFF;
          color: #fff;
          text-decoration: none;
          padding: 14px 24px;
          border-radius: 999px;
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .detail__cta:hover { background: #5238f0; transform: translateY(-1px); }
        .detail__cta svg { width: 15px; height: 15px; }

        /* No image → single centred column */
        .detail__inner--noimg {
          grid-template-columns: 1fr;
          max-width: 640px;
          justify-items: center;
          text-align: center;
        }
        .detail__inner--noimg .detail__rule { margin-left: auto; margin-right: auto; }
        .detail__inner--noimg .detail__body { margin-left: auto; margin-right: auto; }
        .detail__inner--noimg .detail__tags,
        .detail__inner--noimg .detail__meta { justify-content: center; }

        @media (max-width: 820px) {
          .detail__inner {
            grid-template-columns: 1fr;
            gap: clamp(24px, 5vw, 40px);
            max-width: 560px;
          }
          .detail__media img { max-height: 38vh; aspect-ratio: 16 / 10; }
        }

        .back {
          position: absolute;
          bottom: clamp(24px, 4vh, 40px);
          right: clamp(24px, 4vw, 44px);
          z-index: 30;
          background: #1c140a;
          color: #fff;
          border: none;
          padding: 14px 24px 14px 18px;
          border-radius: 999px;
          font: 600 11px/1 var(--font-inter), system-ui, sans-serif;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transform: translateY(14px);
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
          transition-delay: 0.3s;
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
