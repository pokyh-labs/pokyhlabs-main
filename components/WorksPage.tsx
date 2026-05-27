"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useT } from "@/lib/i18n/context"

interface Project {
  id: number
  title: string
  description: string
  tags: string[]
  url?: string | null
  image_url?: string | null
  image_alt?: string | null
  year: number
  status: "live" | "wip" | "concept"
}

export default function WorksPage({ initialProjects = [] }: { initialProjects?: Project[] }) {
  const t = useT()
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  useEffect(() => {
    // Only fetch client-side when no SSR data was provided
    if (initialProjects.length > 0) return
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "")
    fetch(`${base}/api/projects`)
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => setProjects(d.projects || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (headlineRef.current) {
      const lines = headlineRef.current.querySelectorAll<HTMLSpanElement>(".works-line")
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
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "var(--bg)", zIndex: 1 }}>
        <div className="headline-wrapper">
          <div className="headline-content">
            <h1
              ref={headlineRef}
              style={{ width: "100%", color: "#0c0c0c", fontWeight: 500, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', lineHeight: 1.05, letterSpacing: "-0.02em", fontSize: "clamp(28px, 5.6vw, 96px)", userSelect: "none" }}
            >
              <span className="works-line" data-text={t("works_heading")} suppressHydrationWarning style={{ display: "block" }}>
                {t("works_heading")}
              </span>
            </h1>
            <p style={{ marginTop: "1.5rem", fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace", fontSize: "clamp(1rem, 1.4vw, 1.25rem)", fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0c0c0c", opacity: 0.7, userSelect: "none", animation: "chIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) 900ms both" }}>
              {t("works_subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Dark section */}
      <div
        ref={contentRef}
        style={{ position: "relative", zIndex: 2, backgroundColor: "#1a1a1a", minHeight: "100vh", padding: "10vh 5vw", color: "#fff", overflow: "hidden" }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div
            data-reveal
            style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "5rem", display: "flex", alignItems: "center", gap: "14px" }}
          >
            <span style={{ display: "inline-block", width: "28px", height: "1px", background: "#555" }} />
            {t("works_selected")}
          </div>

          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
              <div style={{ borderTop: "1px solid #2a2a2a" }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  const t = useT()
  return (
    <div
      data-reveal
      style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.5rem" }}
    >
      <p style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 400, color: "#333", lineHeight: 1.3 }}>
        {t("works_coming_soon")}
      </p>
      <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "13px", letterSpacing: "0.08em", color: "#444" }}>
        {t("works_admin_note")}
      </p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  display: "block", padding: "3.5rem 0",
  textDecoration: "none", color: "inherit",
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const inner = (
    <>
      <div
        data-reveal
        style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}
      >
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "12px", color: "#593DF8", letterSpacing: "0.15em" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "12px", color: "#444", letterSpacing: "0.08em" }}>
          {project.year}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            data-reveal
            style={{ "--rd": "80ms", fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1rem", color: "#fff", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' } as React.CSSProperties}
          >
            {project.title}
          </h2>
          <p
            data-reveal
            style={{ "--rd": "160ms", fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)", lineHeight: 1.7, color: "#888", marginBottom: "1.5rem", maxWidth: "600px", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' } as React.CSSProperties}
          >
            {project.description}
          </p>
          <div
            data-reveal
            style={{ "--rd": "240ms", display: "flex", flexWrap: "wrap", gap: "8px" } as React.CSSProperties}
          >
            {project.tags.map((tag) => (
              <span
                key={tag}
                style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "11px", letterSpacing: "0.08em", padding: "5px 12px", borderRadius: "999px", border: "1px solid #2a2a2a", color: "#555" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div data-reveal style={{ "--rd": "200ms", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1rem", flexShrink: 0 } as React.CSSProperties}>
          {project.image_url && (
            <div style={{ width: "clamp(120px, 18vw, 220px)", aspectRatio: "16/10", borderRadius: "10px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
              <img
                src={project.image_url}
                alt={project.image_alt || project.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}
          {project.url && (
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "1px solid #2a2a2a", display: "grid", placeItems: "center", color: "#fff", transition: "background 0.25s, border-color 0.25s, transform 0.25s" }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.8 }}>
                <path d="M7 17 L17 7 M9 7 H17 V15" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <article style={{ borderTop: "1px solid #2a2a2a" }}>
      {project.url ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${project.title}`}
          style={{ ...cardStyle, cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
        >
          {inner}
        </a>
      ) : (
        <div style={{ ...cardStyle, cursor: "default" }}>
          {inner}
        </div>
      )}
    </article>
  )
}

