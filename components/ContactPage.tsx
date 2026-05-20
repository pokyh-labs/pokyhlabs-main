"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Header from "@/components/Header"
import { services, budgets, timelines } from "@/lib/services.config"

type Step = 1 | 2 | 3 | 4

const ICONS: Record<string, React.ReactNode> = {
  frontend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  backend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  threejs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  seo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  hosting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  wordpress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h2l2 8 2-5 2 5 2-8h2" />
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  "react-native": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  ),
  flutter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
      <path d="M13.5 2L3 12.5l3.5 3.5L20 2z" />
      <path d="M6.5 16L13 22.5l3.5-3.5-6.5-6.5z" />
      <path d="M13 16l3.5 3.5" />
    </svg>
  ),
}

function useStepTransition(step: Step) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef(step)

  useEffect(() => {
    if (!ref.current || prev.current === step) return
    prev.current = step
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    )
  }, [step])

  return ref
}

export default function ContactPage() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [selected, setSelected] = useState<string[]>([])
  const [budget, setBudget] = useState("")
  const [timeline, setTimeline] = useState("")
  const [brief, setBrief] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const stepRef = useStepTransition(step)

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
      const lines = headlineRef.current.querySelectorAll<HTMLSpanElement>(".contact-line")
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

  const toggleService = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
    setErrors((e) => ({ ...e, services: "" }))
  }, [])

  const advance = () => {
    if (step === 1) {
      if (selected.length === 0) {
        setErrors({ services: "Please select at least one service." })
        return
      }
    }
    if (step === 2) {
      const e: Record<string, string> = {}
      if (!budget) e.budget = "Please select a budget."
      if (!timeline) e.timeline = "Please select a timeline."
      if (Object.keys(e).length > 0) { setErrors(e); return }
    }
    if (step === 3) {
      const e: Record<string, string> = {}
      if (!name.trim()) e.name = "Name is required."
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required."
      if (Object.keys(e).length > 0) { setErrors(e); return }
    }
    setErrors({})
    setStep((s) => (s + 1) as Step)
  }

  const handleSubmit = () => {
    const serviceNames = selected
      .map((id) => services.find((s) => s.id === id)?.name ?? id)
      .join(", ")
    const body = [
      `Services: ${serviceNames}`,
      `Budget: ${budgets.find((b) => b.id === budget)?.label ?? budget}`,
      `Timeline: ${timelines.find((t) => t.id === timeline)?.label ?? timeline}`,
      brief ? `Brief: ${brief}` : null,
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    window.location.href = `mailto:hello@pokyh.studio?subject=New Project – ${name}&body=${encodeURIComponent(body)}`
    setStep(4)
  }

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
                color: "#0c0c0c",
                fontWeight: 500,
                fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontSize: "clamp(28px, 5.6vw, 96px)",
                userSelect: "none",
              }}
            >
              <span className="contact-line" data-text="Let's work." suppressHydrationWarning style={{ display: "block" }}>
                Let's work.
              </span>
            </h1>
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "clamp(0.75rem, 1.1vw, 1rem)",
                fontWeight: 400,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#0c0c0c",
                opacity: 0.5,
                animation: "chIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) 900ms both",
              }}
            >
              Configure your project below.
            </p>
          </div>
        </div>

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
            <span>hello@pokyh.studio</span>
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
            Response within 24h
          </div>
        </div>
      </div>

      {/* ── Form section ── */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          padding: "10vh 5vw 12vh",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>

          {/* Step indicator */}
          {step < 4 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                marginBottom: "5rem",
              }}
            >
              {[
                { n: 1, label: "Services" },
                { n: 2, label: "Details" },
                { n: 3, label: "Contact" },
              ].map(({ n, label }, i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: `1px solid ${step >= n ? "#593DF8" : "#333"}`,
                        background: step === n ? "#593DF8" : step > n ? "#593DF8" : "transparent",
                        display: "grid",
                        placeItems: "center",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {step > n ? (
                        <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
                        </svg>
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-dm-mono), monospace",
                            fontSize: 10,
                            color: step >= n ? "#fff" : "#555",
                          }}
                        >
                          {String(n).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: 11,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: step >= n ? "#fff" : "#444",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        margin: "0 16px",
                        background: step > n ? "#593DF8" : "#2a2a2a",
                        transition: "background 0.3s ease",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          <div ref={stepRef}>
            {step === 1 && (
              <Step1
                selected={selected}
                onToggle={toggleService}
                error={errors.services}
                onNext={advance}
              />
            )}
            {step === 2 && (
              <Step2
                budget={budget}
                setBudget={setBudget}
                timeline={timeline}
                setTimeline={setTimeline}
                brief={brief}
                setBrief={setBrief}
                errors={errors}
                onBack={() => setStep(1)}
                onNext={advance}
              />
            )}
            {step === 3 && (
              <Step3
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                company={company}
                setCompany={setCompany}
                errors={errors}
                onBack={() => setStep(2)}
                onSubmit={handleSubmit}
              />
            )}
            {step === 4 && <Step4 name={name} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 1: Services ─────────────────────────────────────────────────────── */
function Step1({
  selected,
  onToggle,
  error,
  onNext,
}: {
  selected: string[]
  onToggle: (id: string) => void
  error?: string
  onNext: () => void
}) {
  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 2.4vw, 2.4rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
            marginBottom: "0.75rem",
          }}
        >
          What do you need?
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 12,
            color: "#555",
            letterSpacing: "0.1em",
          }}
        >
          Select all that apply — multiple selections are welcome.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: "2.5rem",
        }}
      >
        {services.map((svc) => {
          const active = selected.includes(svc.id)
          return (
            <button
              key={svc.id}
              onClick={() => onToggle(svc.id)}
              style={{
                background: active ? "rgba(89,61,248,0.12)" : "#111",
                border: `1px solid ${active ? "#593DF8" : "#2a2a2a"}`,
                borderRadius: 12,
                padding: "1.4rem 1.4rem 1.2rem",
                cursor: "pointer",
                textAlign: "left",
                color: "#fff",
                transition: "border-color 0.2s, background 0.2s, transform 0.15s",
                transform: active ? "translateY(-2px)" : "none",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.borderColor = "#3d3d3d"
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"
              }}
            >
              {/* Badge */}
              {svc.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: active ? "#593DF8" : "#555",
                    border: `1px solid ${active ? "#593DF8" : "#333"}`,
                    padding: "3px 7px",
                    borderRadius: 999,
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                >
                  {svc.badge}
                </span>
              )}

              {/* Icon */}
              <div
                style={{
                  color: active ? "#593DF8" : "#555",
                  marginBottom: "1rem",
                  transition: "color 0.2s",
                }}
              >
                {ICONS[svc.id]}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  marginBottom: "0.4rem",
                  fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                  color: active ? "#fff" : "#ccc",
                  transition: "color 0.2s",
                }}
              >
                {svc.name}
              </div>

              {/* Pitch */}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: active ? "#aaa" : "#555",
                  fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                  marginBottom: svc.detail ? "0.6rem" : 0,
                  transition: "color 0.2s",
                }}
              >
                {svc.pitch}
              </div>

              {/* Detail — shown when selected */}
              {active && (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#777",
                    fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                    borderTop: "1px solid #2a2a2a",
                    paddingTop: "0.7rem",
                    marginTop: "0.4rem",
                  }}
                >
                  {svc.detail}
                </div>
              )}

              {/* Price */}
              {svc.price && (
                <div
                  style={{
                    marginTop: "0.8rem",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: 13,
                    color: "#593DF8",
                    fontWeight: 500,
                  }}
                >
                  {svc.price}
                </div>
              )}

              {/* Checkmark */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: svc.badge ? "auto" : 12,
                    left: svc.badge ? "auto" : "auto",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#593DF8",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#ff6b6b", marginBottom: "1.5rem" }}>
          {error}
        </p>
      )}

      <NavRow onNext={onNext} nextLabel="Next — Details →" />
    </div>
  )
}

/* ── Step 2: Details ──────────────────────────────────────────────────────── */
function Step2({
  budget, setBudget, timeline, setTimeline, brief, setBrief,
  errors, onBack, onNext,
}: {
  budget: string; setBudget: (v: string) => void
  timeline: string; setTimeline: (v: string) => void
  brief: string; setBrief: (v: string) => void
  errors: Record<string, string>
  onBack: () => void; onNext: () => void
}) {
  return (
    <div>
      <div style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 2.4vw, 2.4rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
            marginBottom: "0.75rem",
          }}
        >
          Tell us about the project.
        </h2>
        <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#555", letterSpacing: "0.1em" }}>
          Helps us send you a precise quote.
        </p>
      </div>

      {/* Budget */}
      <fieldset style={{ border: "none", padding: 0, marginBottom: "2.5rem" }}>
        <legend
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "1rem",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-block", width: 20, height: 1, background: "#555" }} />
          Budget
        </legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {budgets.map((b) => (
            <button
              key={b.id}
              onClick={() => { setBudget(b.id); }}
              style={{
                background: budget === b.id ? "#593DF8" : "transparent",
                border: `1px solid ${budget === b.id ? "#593DF8" : "#2a2a2a"}`,
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
                color: budget === b.id ? "#fff" : "#888",
                fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <span>{b.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7, fontFamily: "var(--font-dm-mono), monospace", letterSpacing: "0.1em" }}>
                {b.note}
              </span>
            </button>
          ))}
        </div>
        {errors.budget && (
          <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#ff6b6b", marginTop: "0.5rem" }}>
            {errors.budget}
          </p>
        )}
      </fieldset>

      {/* Timeline */}
      <fieldset style={{ border: "none", padding: 0, marginBottom: "2.5rem" }}>
        <legend
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "1rem",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-block", width: 20, height: 1, background: "#555" }} />
          Timeline
        </legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {timelines.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeline(t.id)}
              style={{
                background: timeline === t.id ? "#593DF8" : "transparent",
                border: `1px solid ${timeline === t.id ? "#593DF8" : "#2a2a2a"}`,
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
                color: timeline === t.id ? "#fff" : "#888",
                fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <span>{t.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7, fontFamily: "var(--font-dm-mono), monospace", letterSpacing: "0.1em" }}>
                {t.note}
              </span>
            </button>
          ))}
        </div>
        {errors.timeline && (
          <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#ff6b6b", marginTop: "0.5rem" }}>
            {errors.timeline}
          </p>
        )}
      </fieldset>

      {/* Brief */}
      <div style={{ marginBottom: "3rem" }}>
        <label
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "1rem",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-block", width: 20, height: 1, background: "#555" }} />
          Project brief{" "}
          <span style={{ color: "#333", letterSpacing: "0.05em", textTransform: "none", fontSize: 10 }}>
            optional
          </span>
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe your project in a few sentences. What problem are you solving? Who are your users?"
          rows={5}
          style={{
            width: "100%",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "1rem 1.2rem",
            color: "#fff",
            fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#593DF8")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
        />
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Next — Contact →" />
    </div>
  )
}

/* ── Step 3: Contact info ─────────────────────────────────────────────────── */
function Step3({
  name, setName, email, setEmail, company, setCompany,
  errors, onBack, onSubmit,
}: {
  name: string; setName: (v: string) => void
  email: string; setEmail: (v: string) => void
  company: string; setCompany: (v: string) => void
  errors: Record<string, string>
  onBack: () => void; onSubmit: () => void
}) {
  return (
    <div>
      <div style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 2.4vw, 2.4rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
            marginBottom: "0.75rem",
          }}
        >
          How can we reach you?
        </h2>
        <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#555", letterSpacing: "0.1em" }}>
          We'll get back to you within 24 hours.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem 2rem", marginBottom: "3rem" }}>
        <FormField
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Your name"
          error={errors.name}
          required
        />
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          error={errors.email}
          required
        />
        <FormField
          label="Company"
          value={company}
          onChange={setCompany}
          placeholder="Your company (optional)"
          style={{ gridColumn: "1 / -1" }}
        />
      </div>

      <NavRow onBack={onBack} onNext={onSubmit} nextLabel="Send enquiry →" isFinal />
    </div>
  )
}

/* ── Step 4: Success ──────────────────────────────────────────────────────── */
function Step4({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
  }, [])

  return (
    <div ref={ref} style={{ textAlign: "center", padding: "6rem 0" }}>
      {/* Checkmark circle */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(89,61,248,0.15)",
          border: "1px solid #593DF8",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 2.5rem",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28 }}>
          <polyline points="4,12 9,17 20,7" stroke="#593DF8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2
        style={{
          fontSize: "clamp(2rem, 3.5vw, 3.5rem)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#fff",
          fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
          marginBottom: "1rem",
        }}
      >
        {name ? `Thanks, ${name}.` : "Thanks."}
      </h2>

      <p
        style={{
          fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
          fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
          color: "#666",
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 auto 3rem",
        }}
      >
        Your enquiry is on its way. We&apos;ll review your project and get back to you within 24 hours.
      </p>

      <a
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 12,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#555",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}
      >
        ← Back to home
      </a>
    </div>
  )
}

/* ── Shared components ────────────────────────────────────────────────────── */
function FormField({
  label, value, onChange, placeholder, type = "text", required, error, style,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
  error?: string; style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#555",
          marginBottom: "0.6rem",
        }}
      >
        {label} {required && <span style={{ color: "#593DF8" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${error ? "#ff6b6b" : "#2a2a2a"}`,
          outline: "none",
          padding: "0.6rem 0",
          color: "#fff",
          fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
          fontSize: 15,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => { if (!error) e.currentTarget.style.borderBottomColor = "#593DF8" }}
        onBlur={(e) => { if (!error) e.currentTarget.style.borderBottomColor = "#2a2a2a" }}
      />
      {error && (
        <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "#ff6b6b", marginTop: "0.4rem" }}>
          {error}
        </p>
      )}
    </div>
  )
}

function NavRow({
  onBack, onNext, nextLabel, isFinal,
}: {
  onBack?: () => void; onNext: () => void
  nextLabel: string; isFinal?: boolean
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid #2a2a2a" }}>
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#555",
            transition: "color 0.2s",
            padding: "4px 0",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}
        >
          ← Back
        </button>
      ) : (
        <div />
      )}

      <button
        onClick={onNext}
        style={{
          background: isFinal ? "#593DF8" : "#fff",
          color: isFinal ? "#fff" : "#0c0c0c",
          border: "none",
          borderRadius: 999,
          padding: "12px 28px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: 'var(--font-inter), "Inter", "Helvetica Neue", sans-serif',
          letterSpacing: "-0.01em",
          transition: "transform 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = "translateY(-2px)"
          if (isFinal) el.style.background = "#7055fa"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = ""
          if (isFinal) el.style.background = "#593DF8"
        }}
      >
        {nextLabel}
      </button>
    </div>
  )
}
