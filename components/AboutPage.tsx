"use client"

import { useEffect, useRef, forwardRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Header from "@/components/Header"
import { team, type TeamMember } from "@/lib/team.config"

const STATS = [
  { value: "02", label: "Developers" },
  { value: "2024", label: "Founded" },
  { value: "DACH", label: "Region" },
]

export default function AboutPage() {
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])

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
      const lines = headlineRef.current.querySelectorAll<HTMLSpanElement>(".about-line")
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

    sectionsRef.current.forEach((el) => {
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
            start: "top 88%",
            end: "top 58%",
            scrub: true,
          },
        }
      )
    })

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      if (document.body.contains(cursor)) document.body.removeChild(cursor)
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* ── Hero ── */}
      <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "var(--bg)", zIndex: 1 }}>
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
                className="about-line"
                data-text="Built by two."
                suppressHydrationWarning
                style={{ display: "block" }}
              >
                Built by two.
              </span>
            </h1>
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "var(--font-dm-mono), 'JetBrains Mono', monospace",
                fontSize: "clamp(0.75rem, 1.1vw, 1rem)",
                fontWeight: 400,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#0c0c0c",
                opacity: 0.5,
                userSelect: "none",
                animation: "chIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) 900ms both",
              }}
            >
              Software, made in Südtirol.
            </p>
          </div>
        </div>

        {/* Bottom meta strip */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 28,
            right: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0c0c0c",
              opacity: 0.4,
              display: "flex",
              gap: 20,
              animation: "chIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 1200ms both",
            }}
          >
            <span>Est. 2024</span>
            <span>·</span>
            <span>Südtirol, IT</span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0c0c0c",
              opacity: 0.4,
              animation: "chIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 1350ms both",
            }}
          >
            Two devs. One studio.
          </div>
        </div>
      </div>

      {/* ── Dark section ── */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          padding: "12vh 5vw 10vh",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* Manifesto */}
          <section
            ref={(el) => { sectionsRef.current[0] = el }}
            style={{ marginBottom: "9rem" }}
          >
            <p
              style={{
                fontSize: "clamp(1.6rem, 2.6vw, 2.6rem)",
                fontWeight: 400,
                lineHeight: 1.38,
                color: "#fff",
                maxWidth: "820px",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              We don&apos;t do templates. Every project starts from zero — engineered for speed, built to scale, and crafted to leave an impression.
            </p>
          </section>

          {/* Stats */}
          <section
            ref={(el) => { sectionsRef.current[1] = el }}
            style={{
              marginBottom: "9rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderTop: "1px solid #2a2a2a",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  padding: "3.5rem 0",
                  paddingLeft: i > 0 ? "2.5rem" : 0,
                  borderRight: i < STATS.length - 1 ? "1px solid #2a2a2a" : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(2.8rem, 5vw, 5.5rem)",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "#fff",
                    marginBottom: "0.6rem",
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 11,
                    color: "#555",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </section>

          {/* Team label */}
          <div
            ref={(el) => { sectionsRef.current[2] = el }}
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: "4rem",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ display: "inline-block", width: 28, height: 1, background: "#555" }} />
            The Team
          </div>

          {/* Member cards */}
          {team.map((member, i) => (
            <MemberCard
              key={member.id}
              member={member}
              index={i}
              ref={(el: HTMLElement | null) => { sectionsRef.current[i + 3] = el }}
            />
          ))}
          <div style={{ borderTop: "1px solid #2a2a2a" }} />
        </div>
      </div>
    </div>
  )
}

const MemberCard = forwardRef<HTMLElement, { member: TeamMember; index: number }>(
  ({ member, index }, ref) => (
    <article
      ref={ref as React.Ref<HTMLElement>}
      style={{ borderTop: "1px solid #2a2a2a", padding: "3.5rem 0" }}
    >
      {/* Index + role row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.8rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: "#593DF8",
            letterSpacing: "0.2em",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            color: "#444",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: "1px solid #2a2a2a",
            padding: "5px 12px",
            borderRadius: 999,
          }}
        >
          {member.role}
        </span>
      </div>

      {/* Name row with extending line and GitHub button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2.8rem, 6vw, 6rem)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "#fff",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {member.name}
        </h2>

        {/* Extending divider */}
        <div style={{ flex: 1, height: 1, background: "#2a2a2a" }} />

        {/* GitHub button */}
        <a
          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} on GitHub`}
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "1px solid #2a2a2a",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            textDecoration: "none",
            transition: "background 0.25s, border-color 0.25s, transform 0.25s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "#593DF8"
            el.style.borderColor = "#593DF8"
            el.style.transform = "rotate(45deg)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "transparent"
            el.style.borderColor = "#2a2a2a"
            el.style.transform = ""
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: "currentColor" }}>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </div>

      {/* Bio + GitHub link row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "3rem",
        }}
      >
        <p
          style={{
            fontSize: "clamp(0.9rem, 1.15vw, 1.05rem)",
            lineHeight: 1.75,
            color: "#666",
            maxWidth: "580px",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}
        >
          {member.bio}
        </p>
        <a
          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "#555",
            textDecoration: "none",
            textTransform: "uppercase",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#593DF8" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555" }}
        >
          github.com/{member.id}
          <span style={{ fontSize: 14 }}>↗</span>
        </a>
      </div>
    </article>
  )
)
MemberCard.displayName = "MemberCard"
