"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useT } from "@/lib/i18n/context"
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
const Hero = forwardRef<HTMLDivElement>(function Hero(_props, ref) {
    const t = useT()
    const titleRef = useRef<HTMLHeadingElement>(null)
    const bodyRef = useRef<HTMLDivElement>(null)
    const heroTitle = t("works_hero_title")
    const heroLines = [t("works_hero_line1"), t("works_hero_line2"), t("works_hero_line3")]

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
          <div className="hero__eyebrow">{t("works_hero_eyebrow")}</div>
          <h1 ref={titleRef} className="hero__title" aria-label={heroTitle}>
            {heroTitle.split("").map((ch, i) => (
              <span key={i} className="hero__ch" aria-hidden="true">{ch}</span>
            ))}
          </h1>
          <div ref={bodyRef} className="hero__body">
            {heroLines.map((line, i) => (
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
          {t("works_scroll_cue")}
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
  const t = useT()
  const show = !!zoom
  const scrollRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Reset scroll + progress + lightbox when a new project opens. Progress is
  // tracked via CSS var (no React state on every scroll event).
  useEffect(() => {
    if (!show) return
    const el = scrollRef.current
    if (el) {
      el.scrollTop = 0
      el.style.setProperty("--read-progress", "0")
    }
    setLightbox(null)
  }, [show, zoom?.title])

  // Scroll → drive the progress bar via CSS var so we avoid per-frame
  // React re-renders. Listener uses passive scroll, no rAF needed.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? el.scrollTop / max : 0
      el.style.setProperty("--read-progress", String(p))
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [show])

  const hasImage = !!zoom?.imageUrl
  const gallery = zoom?.gallery ?? []
  const body = zoom?.body ?? ""
  // First "real" character gets dropcap treatment; rest of the paragraph follows.
  const dropChar = body.trimStart().charAt(0)
  const rest = dropChar ? body.trimStart().slice(1) : ""

  // Lightbox keyboard nav — wraps around, Esc closes.
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setLightbox(null) }
      else if (e.key === "ArrowRight") { e.preventDefault(); setLightbox(i => i === null ? null : (i + 1) % gallery.length) }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); setLightbox(i => i === null ? null : (i - 1 + gallery.length) % gallery.length) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

  return (
    <>
      <div
        className={`detail${show ? " detail--show" : ""}${hasImage ? "" : " detail--noimg"}`}
        role={show ? "dialog" : undefined}
        aria-modal={show || undefined}
        data-lenis-prevent
        style={{ backgroundColor: DETAIL_BG }}
      >
        {/* Reading progress sliver. CSS var driven so scroll events don't cause React renders. */}
        <div className="detail__progress" aria-hidden="true"><div className="detail__progressFill" /></div>

        <div className="detail__scroll" ref={scrollRef}>
          {/* Hero band — pure typographic, sets the stage. */}
          <header className="detail__hero">
            <div className="detail__heroBody">
              <div className="detail__eyebrow">{zoom?.eyebrow ?? ""}</div>
              <h2 className="detail__title">{zoom?.title ?? ""}</h2>
              <div className="detail__metaStrip">
                {zoom?.year && <span className="detail__metaItem">{zoom.year}</span>}
                {zoom?.status && (
                  <span className="detail__metaItem detail__status">
                    <span className={`detail__statusDot detail__statusDot--${zoom.status.toLowerCase()}`} />
                    {zoom.status.toUpperCase()}
                  </span>
                )}
                {gallery.length > 0 && (
                  <span className="detail__metaItem">{gallery.length} image{gallery.length === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>
          </header>

          {/* Feature band — image NEXT TO text on desktop, stacked on mobile. */}
          <section className={`detail__feature${hasImage ? "" : " detail__feature--noimg"}`}>
            {hasImage && (
              <figure className="detail__featureMedia">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoom!.imageUrl!}
                  alt={zoom?.imageAlt || zoom?.title || ""}
                  loading="eager"
                  decoding="async"
                />
                <figcaption className="detail__featureCaption">
                  <span className="detail__featureCaptionDot" />
                  {t("works_cover_image")}
                </figcaption>
              </figure>
            )}

            <div className="detail__featureBody">
              <div className="detail__sectionHead">
                <span className="detail__sectionLabel">— {t("works_the_story")} —</span>
                <span className="detail__sectionRule" />
              </div>

              <p className="detail__body">
                {dropChar && <span className="detail__dropcap" aria-hidden="true">{dropChar}</span>}
                {dropChar ? rest : body}
              </p>

              {zoom?.tags && zoom.tags.length > 0 && (
                <div className="detail__tags">
                  <span className="detail__tagsLabel">{t("works_tags")}</span>
                  <div className="detail__tagsRow">
                    {zoom.tags.map((tag) => (
                      <span key={tag} className="detail__tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {zoom?.url && (
                <a href={zoom.url} target="_blank" rel="noopener noreferrer" className="detail__cta">
                  <span>{t("works_visit_project")}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              )}
            </div>
          </section>

          {/* Gallery band — only renders when there are extra images. */}
          {gallery.length > 0 && (
            <section className="detail__gallery">
              <div className="detail__sectionHead detail__sectionHead--center">
                <span className="detail__sectionRule" />
                <span className="detail__sectionLabel">— {t("works_gallery_label")} · {String(gallery.length).padStart(2, "0")} —</span>
                <span className="detail__sectionRule" />
              </div>

              <div className="detail__galleryGrid">
                {gallery.map((item, i) => (
                  <button
                    key={item.url + i}
                    type="button"
                    className="detail__galleryItem"
                    onClick={() => setLightbox(i)}
                    aria-label={item.alt || t("works_image_aria").replace("{n}", String(i + 1))}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt || ""} loading="lazy" decoding="async" />
                    <span className="detail__galleryNum">{String(i + 1).padStart(2, "0")}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="detail__footnote" aria-hidden="true">
            <span className="detail__footnoteRule" />
            <span>— {t("works_end_chapter")} —</span>
            <span className="detail__footnoteRule" />
          </div>
        </div>

        {/* Lightbox — fullscreen image viewer for the gallery. */}
        {lightbox !== null && gallery[lightbox] && (
          <div className="lb" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
            <button type="button" className="lb__close" onClick={(e) => { e.stopPropagation(); setLightbox(null) }} aria-label={t("works_close")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  className="lb__nav lb__nav--prev"
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => i === null ? null : (i - 1 + gallery.length) % gallery.length) }}
                  aria-label={t("works_prev")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button
                  type="button"
                  className="lb__nav lb__nav--next"
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => i === null ? null : (i + 1) % gallery.length) }}
                  aria-label={t("works_next")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </>
            )}

            <figure className="lb__stage" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gallery[lightbox].url} alt={gallery[lightbox].alt || ""} decoding="async" />
              {gallery[lightbox].alt && <figcaption>{gallery[lightbox].alt}</figcaption>}
              <div className="lb__counter">{String(lightbox + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</div>
            </figure>
          </div>
        )}
      </div>

      <button type="button" className={`back${show ? " back--show" : ""}`} onClick={onClose} aria-label={t("works_close")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("works_back")}
      </button>

      <style jsx>{`
        .detail {
          position: absolute;
          inset: 0;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s cubic-bezier(.4,0,.2,1);
        }
        .detail--show { opacity: 1; pointer-events: auto; }

        /* Reading-progress sliver (CSS-var driven, no React work per frame). */
        .detail__progress {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: rgba(28, 20, 10, 0.08);
          z-index: 5;
          pointer-events: none;
        }
        .detail__progressFill {
          width: 100%;
          height: 100%;
          background: #644BFF;
          transform-origin: 0 50%;
          transform: scaleX(var(--read-progress, 0));
          will-change: transform;
        }

        .detail__scroll {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          /* CSS var set inline by scroll handler (see useEffect). */
          --read-progress: 0;
        }

        /* ── Hero (typographic only) ─────────────────────────── */
        .detail__hero {
          width: 100%;
          padding: clamp(72px, 13vh, 150px) clamp(24px, 6vw, 100px) clamp(36px, 5vh, 60px);
          box-sizing: border-box;
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.65s cubic-bezier(.4,0,.2,1),
            transform 0.75s cubic-bezier(.2,.8,.2,1);
        }
        .detail--show .detail__hero {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.1s;
        }
        .detail__heroBody {
          max-width: 1080px;
          margin: 0 auto;
        }
        .detail__eyebrow {
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(10px, 1vw, 12px);
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: rgba(40, 28, 8, 0.5);
          margin-bottom: clamp(16px, 2.4vh, 28px);
          font-weight: 600;
        }
        .detail__title {
          font-family: var(--font-inter), sans-serif;
          font-weight: 600;
          font-size: clamp(40px, 7vw, 104px);
          line-height: 0.96;
          letter-spacing: -0.04em;
          color: #1c140a;
          margin: 0;
          /* Long titles get a soft wrap, not horizontal scroll. */
          overflow-wrap: anywhere;
        }
        .detail__metaStrip {
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
        .detail__metaItem { position: relative; display: inline-flex; align-items: center; gap: 8px; }
        .detail__metaItem + .detail__metaItem::before {
          content: "";
          position: absolute;
          left: -12px; top: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
          transform: translateY(-50%);
        }
        .detail__statusDot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ffd76e;
          box-shadow: 0 0 0 3px rgba(255, 215, 110, 0.18);
        }
        .detail__statusDot--live    { background: #6bff9a; box-shadow: 0 0 0 3px rgba(107,255,154,0.18); }
        .detail__statusDot--wip     { background: #ffd76e; box-shadow: 0 0 0 3px rgba(255,215,110,0.18); }
        .detail__statusDot--concept { background: #644BFF; box-shadow: 0 0 0 3px rgba(100,75,255,0.22); }

        /* ── Feature band — image NEXT TO text on desktop ────── */
        .detail__feature {
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(20px, 3vh, 36px) clamp(24px, 6vw, 100px) clamp(40px, 6vh, 72px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: clamp(28px, 5vw, 72px);
          align-items: start;
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.7s cubic-bezier(.4,0,.2,1),
            transform 0.85s cubic-bezier(.2,.8,.2,1);
        }
        .detail--show .detail__feature {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.22s;
        }
        .detail__feature--noimg {
          grid-template-columns: minmax(0, 720px);
          justify-content: center;
        }

        /* Sticky media so long text reads beside a steady image. */
        .detail__featureMedia {
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
        .detail__featureMedia img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .detail__featureCaption {
          position: absolute;
          left: 14px; bottom: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #fff;
          background: rgba(20, 15, 8, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 500;
        }
        .detail__featureCaptionDot {
          width: 5px; height: 5px;
          background: #ffd76e;
          border-radius: 50%;
        }

        .detail__featureBody { min-width: 0; }

        /* Reusable section header (with leading rule). */
        .detail__sectionHead {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: clamp(22px, 3.4vh, 38px);
        }
        .detail__sectionHead--center {
          justify-content: center;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }
        .detail__sectionLabel {
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(9px, 0.85vw, 11px);
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(28, 20, 10, 0.5);
          font-weight: 600;
          white-space: nowrap;
        }
        .detail__sectionRule {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(28,20,10,0.25), rgba(28,20,10,0));
        }
        .detail__sectionHead--center .detail__sectionRule:first-child {
          background: linear-gradient(90deg, rgba(28,20,10,0), rgba(28,20,10,0.25));
        }

        .detail__body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(15px, 1.1vw, 18px);
          color: rgba(28, 20, 10, 0.82);
          line-height: 1.75;
          margin: 0;
          letter-spacing: 0.003em;
          overflow-wrap: break-word;
        }
        .detail__dropcap {
          float: left;
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(56px, 7vw, 92px);
          line-height: 0.82;
          padding: 4px 12px 0 0;
          font-weight: 600;
          color: #644BFF;
          letter-spacing: -0.04em;
        }

        .detail__tags {
          margin-top: clamp(32px, 5vh, 52px);
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid rgba(28, 20, 10, 0.12);
        }
        .detail__tagsLabel {
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(28, 20, 10, 0.45);
          font-weight: 600;
          padding-top: 7px;
          flex-shrink: 0;
        }
        .detail__tagsRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }
        .detail__tag {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid rgba(40, 28, 8, 0.22);
          color: rgba(28, 20, 10, 0.72);
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.4);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .detail__tag:hover {
          background: rgba(100, 75, 255, 0.08);
          border-color: rgba(100, 75, 255, 0.45);
          color: #644BFF;
        }

        .detail__cta {
          margin-top: clamp(32px, 5vh, 52px);
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #1c140a;
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
        .detail__cta::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, #644BFF 0%, #8a72ff 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .detail__cta > * { position: relative; z-index: 1; }
        .detail__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px -16px rgba(100, 75, 255, 0.6);
        }
        .detail__cta:hover::before { opacity: 1; }
        .detail__cta svg { width: 15px; height: 15px; transition: transform 0.25s ease; }
        .detail__cta:hover svg { transform: translate(2px, -2px); }

        /* ── Gallery band ────────────────────────────────────── */
        .detail__gallery {
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(40px, 6vh, 80px) clamp(20px, 5vw, 80px) clamp(24px, 4vh, 48px);
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.7s cubic-bezier(.4,0,.2,1),
            transform 0.85s cubic-bezier(.2,.8,.2,1);
        }
        .detail--show .detail__gallery {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.36s;
        }
        .detail__galleryGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
          gap: clamp(10px, 1.6vw, 18px);
        }
        .detail__galleryItem {
          position: relative;
          appearance: none;
          background: #e7dfcd;
          border: 1px solid rgba(40, 28, 8, 0.1);
          border-radius: 10px;
          overflow: hidden;
          padding: 0;
          margin: 0;
          cursor: zoom-in;
          aspect-ratio: 4 / 3;
          box-shadow: 0 12px 30px -22px rgba(40, 28, 8, 0.4);
          transition: transform 0.3s cubic-bezier(.2,.8,.2,1), box-shadow 0.3s ease;
        }
        .detail__galleryItem:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 40px -24px rgba(40, 28, 8, 0.45);
        }
        .detail__galleryItem img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(.2,.8,.2,1);
        }
        .detail__galleryItem:hover img { transform: scale(1.04); }
        .detail__galleryNum {
          position: absolute;
          top: 10px; right: 10px;
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 999px;
          color: #fff;
          background: rgba(20, 15, 8, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .detail__footnote {
          margin: clamp(40px, 7vh, 80px) auto clamp(80px, 12vh, 140px);
          max-width: 720px;
          padding: 0 clamp(24px, 6vw, 40px);
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: rgba(28, 20, 10, 0.32);
          font-weight: 500;
          justify-content: center;
        }
        .detail__footnoteRule {
          flex: 1;
          max-width: 80px;
          height: 1px;
          background: rgba(28, 20, 10, 0.18);
        }

        /* ── Responsive: stack feature + smaller type on mobile ─ */
        @media (max-width: 860px) {
          .detail__feature {
            grid-template-columns: 1fr;
            gap: clamp(20px, 4vh, 32px);
            padding-left: clamp(20px, 5vw, 36px);
            padding-right: clamp(20px, 5vw, 36px);
          }
          .detail__featureMedia {
            position: static;
            aspect-ratio: 16 / 11;
          }
        }
        @media (max-width: 640px) {
          .detail__hero { padding: clamp(56px, 10vh, 88px) 20px clamp(20px, 3vh, 32px); }
          .detail__title { font-size: clamp(36px, 11vw, 56px); letter-spacing: -0.035em; }
          .detail__metaStrip { gap: 8px 16px; font-size: 10px; }
          .detail__feature { padding: 16px 20px 32px; }
          .detail__featureCaption { left: 10px; bottom: 10px; font-size: 9px; padding: 5px 10px; }
          .detail__sectionLabel { letter-spacing: 0.3em; }
          .detail__body { font-size: 15px; line-height: 1.7; }
          .detail__dropcap { font-size: clamp(54px, 14vw, 72px); padding-right: 10px; }
          .detail__tags { flex-direction: column; gap: 10px; padding-top: 18px; }
          .detail__gallery { padding: 32px 16px 24px; }
          .detail__galleryGrid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .detail__galleryItem { border-radius: 8px; aspect-ratio: 1 / 1; }
          .detail__galleryNum { font-size: 9px; padding: 3px 6px; }
          .detail__cta { padding: 13px 22px; font-size: 12px; }
          .detail__footnote { font-size: 9px; letter-spacing: 0.3em; margin-bottom: 96px; }
        }
        @media (max-width: 380px) {
          .detail__galleryGrid { grid-template-columns: 1fr; }
        }

        /* ── Lightbox ────────────────────────────────────────── */
        .lb {
          position: absolute;
          inset: 0;
          z-index: 40;
          background: rgba(8, 6, 4, 0.94);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 5vh, 60px) clamp(60px, 7vw, 100px);
          animation: lbIn 0.28s ease-out;
        }
        @keyframes lbIn { from { opacity: 0; } to { opacity: 1; } }
        .lb__stage {
          position: relative;
          margin: 0;
          max-width: 100%;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .lb__stage img {
          display: block;
          max-width: 100%;
          max-height: 78vh;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7);
        }
        .lb__stage figcaption {
          color: rgba(255,255,255,0.78);
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
          max-width: 640px;
        }
        .lb__counter {
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
        .lb__close,
        .lb__nav {
          position: absolute;
          top: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: translateY(-50%);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .lb__close { top: clamp(16px, 3vh, 28px); transform: none; }
        .lb__close:hover,
        .lb__nav:hover { background: rgba(255, 255, 255, 0.18); }
        .lb__close { right: clamp(16px, 3vw, 28px); }
        .lb__nav--prev { left: clamp(12px, 2vw, 24px); }
        .lb__nav--next { right: clamp(12px, 2vw, 24px); }
        .lb__close svg,
        .lb__nav svg { width: 18px; height: 18px; }

        @media (max-width: 640px) {
          .lb { padding: 16px 16px 60px; }
          .lb__stage img { max-height: 70vh; }
          .lb__close { width: 38px; height: 38px; right: 12px; top: 12px; }
          .lb__nav {
            top: auto;
            bottom: 14px;
            transform: none;
            width: 40px; height: 40px;
          }
          .lb__nav--prev { left: 30%; }
          .lb__nav--next { right: 30%; }
        }

        /* ── Back button (fixed bottom-right) ────────────────── */
        .back {
          position: absolute;
          bottom: clamp(20px, 4vh, 40px);
          right: clamp(16px, 4vw, 44px);
          z-index: 30;
          background: #1c140a;
          color: #fff;
          border: none;
          padding: 12px 22px 12px 16px;
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
          box-shadow: 0 12px 30px -14px rgba(0,0,0,0.5);
        }
        .back--show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
          transition-delay: 0.4s;
        }
        .back:hover { background: #000; transform: translateY(-1px); }
        .back svg { width: 14px; height: 14px; }
        @media (max-width: 640px) {
          .back { font-size: 10px; padding: 10px 18px 10px 14px; letter-spacing: 1.6px; }
          .back svg { width: 12px; height: 12px; }
        }
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
