"use client"


import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
// Register GSAP plugins globally before any component code runs
gsap.registerPlugin(ScrollTrigger)

type Step = 1 | 2 | 3 | 4 | 5 | 6
type VisualStep = { n: number; label: string }

const SERVICES = [
  {
    id: "website",
    label: "Website",
    description: "Landing page, corporate site or web app",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 22, height: 22 }}>
        <rect x="2" y="3" width="16" height="13" rx="2" />
        <path d="M2 7h16" />
        <circle cx="5" cy="5" r=".6" fill="currentColor" stroke="none" />
        <circle cx="7.5" cy="5" r=".6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "app",
    label: "App",
    description: "iOS, Android or cross-platform",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 22, height: 22 }}>
        <rect x="5" y="2" width="10" height="16" rx="2.5" />
        <circle cx="10" cy="15.5" r=".7" fill="currentColor" stroke="none" />
        <path d="M8 4.5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hosting",
    label: "Hosting",
    description: "Managed hosting, SSL & uptime monitoring",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 22, height: 22 }}>
        <rect x="2" y="4" width="16" height="5" rx="1.5" />
        <rect x="2" y="11" width="16" height="5" rx="1.5" />
        <circle cx="15" cy="6.5" r=".7" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13.5" r=".7" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

const STEPS: VisualStep[] = [
  { n: 1, label: "Services" },
  { n: 2, label: "Project" },
  { n: 3, label: "Company" },
  { n: 4, label: "Deadline" },
  { n: 5, label: "Contact" },
]

const HOSTING_STEPS: VisualStep[] = [
  { n: 1, label: "Service" },
  { n: 2, label: "Hosting" },
  { n: 5, label: "Contact" },
]

const HOSTING_STACKS = [
  { id: "nodejs",    label: "Node.js" },
  { id: "nextjs",    label: "Next.js" },
  { id: "react",     label: "React" },
  { id: "vue",       label: "Vue.js" },
  { id: "nuxt",      label: "Nuxt.js" },
  { id: "angular",   label: "Angular" },
  { id: "wordpress", label: "WordPress" },
  { id: "php",       label: "PHP / Laravel" },
  { id: "python",    label: "Python" },
  { id: "go",        label: "Go" },
  { id: "docker",    label: "Docker" },
  { id: "static",    label: "Static Site" },
  { id: "svelte",    label: "Svelte" },
  { id: "astro",     label: "Astro" },
]

export default function ContactPage() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const stepIndicatorRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [services, setServices] = useState<string[]>([])
  const [include3d, setInclude3d] = useState(false)
  const [description, setDescription] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [company, setCompany] = useState("")
  const [deadline, setDeadline] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [hostingStack, setHostingStack] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const isHostingOnly = services.length > 0 && services.every(s => s === "hosting")
  const visibleSteps = isHostingOnly ? HOSTING_STEPS : STEPS

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Cursor glow
    const cursor = document.createElement("div")
    cursor.style.cssText =
      "position:fixed;top:0;left:0;width:400px;height:400px;border-radius:50%;" +
      "background-image:radial-gradient(circle,rgba(89,61,248,0.10)0%,transparent 70%);" +
      "pointer-events:none;transform:translate(-50%,-50%);z-index:0;"
    document.body.appendChild(cursor)
    const moveCursor = (e: MouseEvent) =>
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.8, ease: "power3.out" })
    window.addEventListener("mousemove", moveCursor)

    // Headline character animation
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

    // No scroll-to-reveal on the section itself — magic happens inside.

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      if (document.body.contains(cursor)) document.body.removeChild(cursor)
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  const toggleService = useCallback((id: string) => {
    setServices(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      if (!next.includes("website")) setInclude3d(false)
      if (!next.includes("hosting")) setHostingStack([])
      return next
    })
    setErrors(e => ({ ...e, services: "" }))
  }, [])

  const toggleHostingStack = useCallback((id: string) => {
    setHostingStack(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }, [])

  const goNext = () => {
    const e: Record<string, string> = {}
    if (step === 1 && services.length === 0) e.services = "Select at least one service."
    if (step === 2 && isHostingOnly && !repoUrl.trim()) {
      e.repoUrl = "Please share a link so we know what to host."
    }
    if (step === 5) {
      if (!name.trim()) e.name = "Name is required."
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required."
    }
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    // Hosting-only: jump from step 2 straight to step 5 (skip company + deadline)
    if (isHostingOnly && step === 2) { setStep(5); return }
    setStep(s => (s + 1) as Step)
  }

  const goBack = () => {
    setErrors({})
    // Hosting-only: jump from contact back to hosting step
    if (isHostingOnly && step === 5) { setStep(2); return }
    setStep(s => (s - 1) as Step)
  }

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Name is required."
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required."
    if (Object.keys(e).length) { setErrors(e); return }

    const finalServices = services.includes("website") && include3d
      ? [...services, "threejs"]
      : services

    // Build description with all hosting details + optional combo discount note
    const descParts: string[] = []
    const hasDiscount = services.includes("website") && services.includes("hosting")
    if (hasDiscount) descParts.push("Kombipaket: Website + Hosting (5% Rabatt auf Entwicklung, Hosting fix €20/mo)")
    if (services.includes("hosting") && hostingStack.length > 0) {
      descParts.push(`Tech Stack: ${hostingStack.join(", ")}`)
    }
    if (isHostingOnly && repoUrl.trim()) descParts.push(`Repo / File URL: ${repoUrl.trim()}`)
    if (description.trim()) descParts.push(description.trim())
    const finalDescription = descParts.length > 0 ? descParts.join("\n\n") : null

    setSubmitting(true)
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: finalServices,
          description: finalDescription,
          company: company.trim() || null,
          deadline: deadline || null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErrors({ submit: (d as { error?: string }).error ?? "Something went wrong. Please try again." })
        return
      }
      setStep(6)
    } catch {
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        .svc-btn { transition: border-color 0.18s, background 0.18s, transform 0.18s; cursor:pointer; text-align:left; }
        .svc-btn:hover { transform: translateY(-2px); }
        .c-input { transition: border-color 0.18s; }
        .c-input:focus { outline: none; }
        .c-btn { transition: transform 0.18s, opacity 0.18s; }
        .c-btn:hover:not([disabled]) { transform: translateY(-1px); }
        .c-back { transition: color 0.18s; }
        .c-back:hover { color: rgba(255,255,255,0.85) !important; }
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
            pokyh.studio — Contact
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
            <span className="contact-line" data-text="Let's work." style={{ display: "block" }}>
              Let&apos;s work.
            </span>
          </h1>
          <p style={{
            marginTop: "2rem",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(0.9rem, 1.2vw, 1.1rem)",
            color: "var(--black)",
            opacity: 0.45,
            maxWidth: 400,
            lineHeight: 1.65,
            fontWeight: 400,
            animation: "chIn 0.6s cubic-bezier(0.22,0.61,0.36,1) 900ms both",
          }}>
            Tell us about your project and we&apos;ll get back within 24 hours.
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
            hello@pokyh.studio
          </span>
          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--black)", opacity: 0.35, animation: "chIn 0.5s cubic-bezier(0.22,0.61,0.36,1) 1400ms both" }}>
            Response within 24h
          </span>
        </div>
      </div>

      {/* ── Form section ── */}
      <div
        ref={formRef}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          padding: "clamp(60px,10vh,120px) clamp(28px,6vw,100px) clamp(80px,14vh,160px)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 2 }}>

          {/* Step indicator */}
          {step < 6 && (
            <div ref={stepIndicatorRef} style={{ display: "flex", alignItems: "center", marginBottom: "clamp(44px,8vh,80px)" }}>
              {visibleSteps.map(({ n, label }, i) => {
                const done = step > n
                const active = step === n
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", flex: i < visibleSteps.length - 1 ? 1 : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        border: `1px solid ${done || active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}`,
                        background: done ? "rgba(255,255,255,0.88)" : active ? "rgba(255,255,255,0.08)" : "transparent",
                        display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.3s",
                      }}>
                        {done ? (
                          <svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9 }}>
                            <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth={1.8} strokeLinecap="round" />
                          </svg>
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 9, color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.2)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: done || active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", transition: "color 0.3s" }}>
                        {label}
                      </span>
                    </div>
                    {i < visibleSteps.length - 1 && (
                      <div style={{ flex: 1, height: 1, margin: "0 14px", background: done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)", transition: "background 0.3s" }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Step content — key remounts, each step animates its own children */}
          <div key={step}>
            {step === 1 && (
              <StepServices
                services={services}
                include3d={include3d}
                onToggle={toggleService}
                onToggle3d={() => setInclude3d(v => !v)}
                hostingStack={hostingStack}
                onToggleStack={toggleHostingStack}
                error={errors.services}
                onNext={goNext}
              />
            )}
            {step === 2 && isHostingOnly && (
              <StepHosting
                repoUrl={repoUrl} onChangeRepo={setRepoUrl}
                error={errors.repoUrl}
                onBack={goBack} onNext={goNext}
              />
            )}
            {step === 2 && !isHostingOnly && (
              <StepDescription value={description} onChange={setDescription} onBack={goBack} onNext={goNext} />
            )}
            {step === 3 && (
              <StepCompany value={company} onChange={setCompany} onBack={goBack} onNext={goNext} />
            )}
            {step === 4 && (
              <StepDeadline value={deadline} onChange={setDeadline} onBack={goBack} onNext={goNext} />
            )}
            {step === 5 && (
              <StepContact
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                errors={errors}
                submitting={submitting}
                submitError={errors.submit}
                onBack={goBack}
                onSubmit={handleSubmit}
              />
            )}
            {step === 6 && <StepSuccess name={name} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 1: Services ─────────────────────────────────────────────── */
function StepServices({ services, include3d, onToggle, onToggle3d, hostingStack, onToggleStack, error, onNext }: {
  services: string[]; include3d: boolean
  onToggle: (id: string) => void; onToggle3d: () => void
  hostingStack: string[]; onToggleStack: (id: string) => void
  error?: string; onNext: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const discountRef = useRef<HTMLDivElement>(null)
  const threeDRef = useRef<HTMLDivElement>(null)
  const websiteSelected = services.includes("website")
  const hostingSelected = services.includes("hosting")
  const showDiscount = websiteSelected && hostingSelected
  const prevHosting = useRef(hostingSelected)
  const prevDiscount = useRef(false)
  const prevWebsite = useRef(websiteSelected)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial hidden state — visible only when scrolled into view
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 24 })
      gsap.set("[data-a='card']", { autoAlpha: 0, y: 60, scale: 0.92, rotateX: -35, filter: "blur(12px)" })
      gsap.set("[data-a='nav']", { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, duration: 0.5 })
        .to("[data-a='card']", { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.08, ease: "expo.out" }, "-=0.2")
        .to("[data-a='nav']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.35")
    }, containerRef)

    // Initial collapsed state for the three expandable rows
    if (threeDRef.current && !websiteSelected) {
      gsap.set(threeDRef.current, { autoAlpha: 0, height: 0, overflow: "hidden" })
    }
    if (stackRef.current && !hostingSelected) {
      gsap.set(stackRef.current, { autoAlpha: 0, height: 0, overflow: "hidden" })
    }
    if (discountRef.current && !showDiscount) {
      gsap.set(discountRef.current, { autoAlpha: 0, height: 0, overflow: "hidden" })
    }

    return () => ctx.revert()
  }, [])

  // Animate 3D toggle in/out when website selection changes
  useEffect(() => {
    const el = threeDRef.current
    if (!el) return
    if (prevWebsite.current === websiteSelected) return
    prevWebsite.current = websiteSelected
    if (websiteSelected) {
      const inner = el.querySelector<HTMLElement>(".threeD-inner")
      gsap.fromTo(el,
        { height: 0, autoAlpha: 0 },
        {
          height: "auto", autoAlpha: 1, duration: 0.45, ease: "power3.out",
          clearProps: "height,overflow",
          onStart: () => { if (inner) gsap.set(inner, { autoAlpha: 0, y: 18, scale: 0.96, filter: "blur(10px)" }) },
          onComplete: () => {
            if (inner) {
              gsap.to(inner, {
                autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)",
                duration: 0.55, ease: "expo.out",
              })
            }
          },
        }
      )
    } else {
      gsap.to(el, {
        height: 0, autoAlpha: 0, duration: 0.28, ease: "power2.in",
        onStart: () => { if (el) el.style.overflow = "hidden" },
      })
    }
  }, [websiteSelected])

  // Animate tech stack section in/out with staggered children reveal
  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    if (prevHosting.current === hostingSelected) return
    prevHosting.current = hostingSelected
    if (hostingSelected) {
      const heading = el.querySelector<HTMLElement>("[data-stack='heading']")
      const desc = el.querySelector<HTMLElement>("[data-stack='desc']")
      const pills = el.querySelectorAll<HTMLElement>("[data-pill]")
      gsap.set([heading, desc].filter(Boolean), { autoAlpha: 0, y: 14, filter: "blur(8px)" })
      gsap.set(pills, { autoAlpha: 0, y: 18, scale: 0.55, filter: "blur(10px)" })
      gsap.fromTo(el,
        { height: 0, autoAlpha: 0 },
        {
          height: "auto", autoAlpha: 1, duration: 0.45, ease: "power3.out",
          clearProps: "height,overflow",
          onComplete: () => {
            const tl = gsap.timeline()
            if (heading) tl.to(heading, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" })
            if (desc) tl.to(desc, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, "-=0.35")
            tl.to(pills, {
              autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)",
              duration: 0.6, stagger: { each: 0.028, from: "start" }, ease: "expo.out",
            }, "-=0.3")
          },
        }
      )
    } else {
      gsap.to(el, {
        height: 0, autoAlpha: 0, duration: 0.28, ease: "power2.in",
        onStart: () => { if (el) el.style.overflow = "hidden" },
      })
    }
  }, [hostingSelected])

  // Animate discount badge in/out with springy entry + staggered inner reveal
  useEffect(() => {
    const el = discountRef.current
    if (!el) return
    if (prevDiscount.current === showDiscount) return
    prevDiscount.current = showDiscount
    if (showDiscount) {
      const icon = el.querySelector<HTMLElement>("[data-discount='icon']")
      const text = el.querySelectorAll<HTMLElement>("[data-discount='text']")
      gsap.set(icon, { autoAlpha: 0, scale: 0.4, rotate: -40, filter: "blur(8px)" })
      gsap.set(text, { autoAlpha: 0, x: -14, filter: "blur(6px)" })
      gsap.fromTo(el,
        { height: 0, autoAlpha: 0, scale: 0.96 },
        {
          height: "auto", autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)",
          clearProps: "height,overflow,scale",
          onComplete: () => {
            const tl = gsap.timeline()
            tl.to(icon, { autoAlpha: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 0.6, ease: "back.out(2)" })
              .to(text, {
                autoAlpha: 1, x: 0, filter: "blur(0px)",
                duration: 0.45, stagger: 0.08, ease: "power3.out",
              }, "-=0.4")
          },
        }
      )
    } else {
      gsap.to(el, {
        height: 0, autoAlpha: 0, duration: 0.25, ease: "power2.in",
        onStart: () => { if (el) el.style.overflow = "hidden" },
      })
    }
  }, [showDiscount])

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="01" title="What do you need?" sub="Select all that apply." />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: "1rem",
          perspective: 1200,
        }}
      >
        {SERVICES.map(svc => {
          const active = services.includes(svc.id)
          return (
            <button
              key={svc.id}
              data-a="card"
              onClick={() => onToggle(svc.id)}
              className="svc-btn"
              style={{
                background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14,
                padding: "1.2rem 1.2rem 1.1rem",
                color: "#fff",
                position: "relative",
              }}
            >
              <div style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)", marginBottom: "0.8rem", transition: "color 0.18s" }}>
                {svc.icon}
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.015em", color: active ? "#fff" : "rgba(255,255,255,0.55)", marginBottom: "0.3rem", transition: "color 0.18s" }}>
                {svc.label}
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", lineHeight: 1.5, color: active ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.22)", transition: "color 0.18s" }}>
                {svc.description}
              </div>
              {active && (
                <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.88)", display: "grid", placeItems: "center" }}>
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                    <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 3D toggle — always in DOM, GSAP-animated in/out when website is toggled */}
      <div ref={threeDRef} style={{ overflow: "hidden" }}>
        <div className="threeD-inner" style={{ marginBottom: "1rem", willChange: "transform, filter, opacity" }}>
          <button
            onClick={onToggle3d}
            className="svc-btn"
            style={{
              width: "100%",
              background: include3d ? "rgba(89,61,248,0.12)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${include3d ? "rgba(89,61,248,0.45)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 14,
              padding: "1rem 1.2rem",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              border: `1.5px solid ${include3d ? "rgba(89,61,248,0.7)" : "rgba(255,255,255,0.2)"}`,
              background: include3d ? "rgba(89,61,248,0.25)" : "transparent",
              display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.18s",
            }}>
              {include3d && (
                <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                  <polyline points="2,6 5,9 10,3" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", fontWeight: 500, color: include3d ? "#c4b5fd" : "rgba(255,255,255,0.55)", letterSpacing: "-0.01em", transition: "color 0.18s" }}>
                Add 3D & WebGL elements
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "rgba(255,255,255,0.22)", marginTop: 2 }}>
                Immersive 3D experiences in the browser — no app needed
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tech stack — always in DOM, GSAP-animated in/out when hosting is toggled */}
      <div ref={stackRef} style={{ overflow: "hidden" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.1rem", marginBottom: "1rem" }}>
          <p data-stack="heading" style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.45rem", willChange: "transform, filter, opacity" }}>
            Tech Stack
          </p>
          <p data-stack="desc" style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.5, marginBottom: "0.9rem", willChange: "transform, filter, opacity" }}>
            Was soll gehostet werden? Mehrfachauswahl möglich.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {HOSTING_STACKS.map(stack => {
              const active = hostingStack.includes(stack.id)
              return (
                <button
                  key={stack.id}
                  data-pill="true"
                  onClick={() => onToggleStack(stack.id)}
                  className="svc-btn"
                  style={{
                    background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 999,
                    padding: "6px 16px",
                    color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-inter)",
                    fontSize: "0.8rem",
                    fontWeight: active ? 500 : 400,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                  }}
                >
                  {stack.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Combo discount — always in DOM, GSAP-animated in/out when website+hosting toggled */}
      <div ref={discountRef} style={{ overflow: "hidden", height: 0 }}>
        <div style={{
          background: "rgba(89,61,248,0.07)",
          border: "1px solid rgba(89,61,248,0.22)",
          borderRadius: 12,
          padding: "0.85rem 1.1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div data-discount="icon" style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(89,61,248,0.15)",
            border: "1px solid rgba(89,61,248,0.28)",
            display: "grid", placeItems: "center", flexShrink: 0,
            willChange: "transform, filter, opacity",
          }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth={1.4} style={{ width: 16, height: 16 }}>
              <path d="M9 2l1.5 4.5H15l-3.5 2.5L13 13.5 9 11l-4 2.5 1.5-4.5L3 6.5h4.5z" />
            </svg>
          </div>
          <div>
            <p data-discount="text" style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", fontWeight: 600, color: "rgba(167,139,250,0.92)", letterSpacing: "-0.01em", willChange: "transform, filter, opacity" }}>
              5% Kombirabatt auf die Entwicklung
            </p>
            <p data-discount="text" style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "rgba(255,255,255,0.28)", marginTop: 2, lineHeight: 1.4, willChange: "transform, filter, opacity" }}>
              Website + Hosting zusammen → 5% Rabatt auf die Entwicklungskosten. Hosting bleibt fix €20/mo.
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorMsg msg={error} style={{ marginBottom: "1.5rem" }} />}
      <div data-a="nav"><NavRow onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 2 (Hosting-only): Hosting details + repo link ──────────── */
function StepHosting({ repoUrl, onChangeRepo, error, onBack, onNext }: {
  repoUrl: string; onChangeRepo: (v: string) => void
  error?: string; onBack: () => void; onNext: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='pricing']", { autoAlpha: 0, y: 30, scale: 0.96, filter: "blur(12px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 22, filter: "blur(8px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']",  { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='pricing']",  { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }, "-=0.3")
        .to("[data-a='field']",    { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 }, "-=0.4")
        .to("[data-a='nav']",      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const features = [
    "Managed deployment & setup",
    "SSL certificate (HTTPS)",
    "24 / 7 uptime monitoring",
    "Custom domain support",
  ]

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="02" title="Hosting details." sub="We take care of everything — you just share your files." />
      </div>

      {/* Pricing card */}
      <div data-a="pricing" style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 18,
        padding: "1.5rem 1.6rem",
        marginBottom: "2rem",
      }}>
        {/* Price row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>
              Hosting-Paket
            </p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 300, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>
              €20
              <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "rgba(255,255,255,0.3)", letterSpacing: "-0.01em", marginLeft: 6 }}>/ Monat</span>
            </p>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: "5px 14px",
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}>
            Alles inklusive
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <svg viewBox="0 0 12 12" fill="none" style={{ width: 7, height: 7 }}>
                  <polyline points="2,6 5,9 10,3" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Repo URL input */}
      <div data-a="field" style={{ marginBottom: error ? "0.5rem" : "3rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.6rem" }}>
          Your repo or file link
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={e => onChangeRepo(e.target.value)}
          placeholder="https://github.com/your-username/your-repo"
          className="c-input"
          onKeyDown={e => { if (e.key === "Enter") onNext() }}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${error ? "rgba(255,80,80,0.55)" : "rgba(255,255,255,0.1)"}`,
            padding: "0.75rem 0",
            color: "#fff",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(1.0rem, 1.8vw, 1.3rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            boxSizing: "border-box",
          }}
          onFocus={e => { if (!error) e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)" }}
          onBlur={e => { if (!error) e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)" }}
        />
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", marginTop: "0.55rem", lineHeight: 1.5 }}>
          GitHub-Repo, ZIP-URL oder jeder andere Link zu deinen Projektdateien — wir richten alles ein.
        </p>
        {error && <ErrorMsg msg={error} style={{ marginTop: "0.4rem" }} />}
      </div>
      {error && <div style={{ marginBottom: "2.5rem" }} />}

      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 2: Description ──────────────────────────────────────────── */
function StepDescription({ value, onChange, onBack, onNext }: {
  value: string; onChange: (v: string) => void; onBack: () => void; onNext: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="02" title="Describe your project." sub="Optional — helps us give you a precise quote." /></div>
      <div data-a="field">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="What are you building? Who are your users? Any references or ideas?"
          rows={6}
          className="c-input"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "1.1rem 1.25rem",
            color: "rgba(255,255,255,0.82)",
            fontFamily: "var(--font-inter)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            resize: "vertical",
            marginBottom: "2.5rem",
            boxSizing: "border-box",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>
      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 3: Company ──────────────────────────────────────────────── */
function StepCompany({ value, onChange, onBack, onNext }: {
  value: string; onChange: (v: string) => void; onBack: () => void; onNext: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="03" title="What's the company?" sub="Optional — leave blank if personal." /></div>
      <div data-a="field">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Company or brand name"
          className="c-input"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            padding: "0.75rem 0",
            color: "#fff",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            marginBottom: "3rem",
            boxSizing: "border-box",
          }}
          onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)")}
          onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
          onKeyDown={e => { if (e.key === "Enter") onNext() }}
        />
      </div>
      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 4: Deadline ─────────────────────────────────────────────── */
function StepDeadline({ value, onChange, onBack, onNext }: {
  value: string; onChange: (v: string) => void; onBack: () => void; onNext: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split("T")[0]
  })()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="04" title="When do you need it?" sub="Optional — earliest possible is 1 week from today." />
      </div>
      <div data-a="field" style={{ marginBottom: "3rem" }}>
        <style>{`
          .deadline-input::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
          .deadline-input::-webkit-inner-spin-button { display: none; }
        `}</style>
        <input
          type="date"
          value={value}
          min={minDate}
          onChange={e => onChange(e.target.value)}
          className="c-input deadline-input"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            padding: "0.75rem 0",
            color: value ? "#fff" : "rgba(255,255,255,0.25)",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            boxSizing: "border-box",
            colorScheme: "dark",
          }}
          onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)")}
          onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
        />
      </div>
      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 5: Contact ──────────────────────────────────────────────── */
function StepContact({ name, setName, email, setEmail, errors, submitting, submitError, onBack, onSubmit }: {
  name: string; setName: (v: string) => void
  email: string; setEmail: (v: string) => void
  errors: Record<string, string>; submitting: boolean
  submitError?: string; onBack: () => void; onSubmit: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.1, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="05" title="How can we reach you?" sub="We'll reply within 24 hours." /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem", marginBottom: "3rem" }}>
        <div data-a="field">
          <UnderlineField label="Your name" value={name} onChange={setName} placeholder="Full name" error={errors.name} onEnter={onSubmit} />
        </div>
        <div data-a="field">
          <UnderlineField label="Email address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" error={errors.email} onEnter={onSubmit} />
        </div>
      </div>
      {submitError && <ErrorMsg msg={submitError} style={{ marginBottom: "1.5rem" }} />}
      <div data-a="nav"><NavRow onBack={onBack} onNext={onSubmit} nextLabel={submitting ? "Sending…" : "Send enquiry"} isFinal disabled={submitting} /></div>
    </div>
  )
}

/* ── Step 6: Success ──────────────────────────────────────────────── */
function StepSuccess({ name }: { name: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
      tl.fromTo("[data-a='icon']",    { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(1.8)" })
        .fromTo("[data-a='title']",   { autoAlpha: 0, y: 24 },      { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.2")
        .fromTo("[data-a='sub']",     { autoAlpha: 0, y: 18 },      { autoAlpha: 1, y: 0, duration: 0.42 }, "-=0.2")
        .fromTo("[data-a='link']",    { autoAlpha: 0, y: 14 },      { autoAlpha: 1, y: 0, duration: 0.38 }, "-=0.15")
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} style={{ textAlign: "center", padding: "5rem 0 7rem" }}>
      <div data-a="icon" style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", display: "grid", placeItems: "center", margin: "0 auto 2.5rem" }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
          <polyline points="4,12 9,17 20,7" stroke="rgba(255,255,255,0.75)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 data-a="title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fff", fontFamily: "var(--font-inter)", marginBottom: "1rem" }}>
        {name ? `Thanks, ${name}.` : "Thanks."}
      </h2>
      <p data-a="sub" style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(0.9rem, 1.3vw, 1.05rem)", color: "rgba(255,255,255,0.33)", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 3.5rem" }}>
        Your enquiry is on its way. We&apos;ll review your project and get back to you soon.
      </p>
      <a
        data-a="link"
        href="/"
        style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none", transition: "color 0.2s" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)")}
      >
        ← Back to home
      </a>
    </div>
  )
}

/* ── Shared ──────────────────────────────────────────────────────── */
function StepHeading({ label, title, sub }: { label: string; title: string; sub: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const t = titleRef.current
    if (!t) return
    // Split title into per-word spans (preserves spaces) with per-char inner spans for blur reveal
    const words = title.split(" ")
    t.innerHTML = words
      .map(
        w =>
          `<span class="h-word" style="display:inline-block;white-space:nowrap;margin-right:0.28em;">` +
          [...w].map(c => `<span class="h-char" style="display:inline-block;">${c === " " ? "&nbsp;" : c}</span>`).join("") +
          `</span>`
      )
      .join("")

    const chars = t.querySelectorAll(".h-char")
    // Set initial hidden state so nothing is visible before viewport entry
    gsap.set(chars, { autoAlpha: 0, y: 28, filter: "blur(14px)", rotateX: -40 })

      const tl = gsap.timeline({ paused: true })
      ScrollTrigger.create({
        trigger: t,
        start: "top 92%",
        once: true,
        onEnter: () => tl.play(),
      })
    if (labelRef.current) {
      tl.fromTo(labelRef.current,
        { autoAlpha: 0, y: 12, filter: "blur(8px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" })
    }
    tl.to(chars, {
      autoAlpha: 1, y: 0, filter: "blur(0px)", rotateX: 0,
      duration: 0.7, ease: "power3.out", stagger: 0.018,
    }, "-=0.3")
    if (subRef.current) {
      tl.fromTo(subRef.current,
        { autoAlpha: 0, y: 14, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, "-=0.4")
    }
  }, [title])

  return (
    <div style={{ marginBottom: "clamp(1.75rem, 4vh, 3rem)", perspective: 800 }}>
      <p ref={labelRef} style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.85rem", opacity: 0 }}>
        {label}
      </p>
      <h2
        ref={titleRef}
        style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.8rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fff", fontFamily: "var(--font-inter)", marginBottom: "0.55rem", lineHeight: 1.08 }}
      >
        {title}
      </h2>
      <p ref={subRef} style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, opacity: 0 }}>
        {sub}
      </p>
    </div>
  )
}

function UnderlineField({ label, value, onChange, placeholder, type = "text", error, onEnter }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; error?: string; onEnter?: () => void
}) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.6rem" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="c-input"
        onKeyDown={e => { if (e.key === "Enter" && onEnter) onEnter() }}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${error ? "rgba(255,80,80,0.55)" : "rgba(255,255,255,0.1)"}`,
          padding: "0.6rem 0",
          color: "#fff",
          fontFamily: "var(--font-inter)",
          fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
          fontWeight: 300,
          letterSpacing: "-0.02em",
          boxSizing: "border-box",
        }}
        onFocus={e => { if (!error) e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)" }}
        onBlur={e => { if (!error) e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)" }}
      />
      {error && <ErrorMsg msg={error} style={{ marginTop: "0.4rem" }} />}
    </div>
  )
}

function ErrorMsg({ msg, style: s }: { msg: string; style?: React.CSSProperties }) {
  return (
    <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, color: "rgba(255,100,100,0.85)", letterSpacing: "0.04em", ...s }}>
      {msg}
    </p>
  )
}

function NavRow({ onBack, onNext, nextLabel, isFinal, disabled }: {
  onBack?: () => void; onNext: () => void; nextLabel: string; isFinal?: boolean; disabled?: boolean
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  // Magnetic effect — button reacts even when cursor is OUTSIDE its bounds
  // (extended hover zone with smooth falloff)
  useEffect(() => {
    const btn = btnRef.current
    const label = labelRef.current
    if (!btn || !label || disabled) return

    const xTo  = gsap.quickTo(btn,   "x", { duration: 0.55, ease: "power3.out" })
    const yTo  = gsap.quickTo(btn,   "y", { duration: 0.55, ease: "power3.out" })
    const lxTo = gsap.quickTo(label, "x", { duration: 0.45, ease: "power3.out" })
    const lyTo = gsap.quickTo(label, "y", { duration: 0.45, ease: "power3.out" })
    const ZONE = 45          // px beyond button edges wo Magnetismus wirkt
    const PULL = 0.42        // how strongly the button itself follows the cursor
    const LABEL_PULL = 0.18  // inner-label parallax inside the button

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const halfW = rect.width / 2
      const halfH = rect.height / 2
      const dx = e.clientX - (rect.left + halfW)
      const dy = e.clientY - (rect.top + halfH)

      // Distance to nearest edge (0 if cursor is inside the button)
      const edgeX = Math.max(0, Math.abs(dx) - halfW)
      const edgeY = Math.max(0, Math.abs(dy) - halfH)
      const edgeDist = Math.hypot(edgeX, edgeY)

      if (edgeDist < ZONE) {
        // Smooth quadratic falloff — 1 at edge, 0 at zone boundary
        const f = 1 - edgeDist / ZONE
        const falloff = f * f
        xTo(dx * PULL * falloff)
        yTo(dy * PULL * falloff)
        lxTo(dx * LABEL_PULL * falloff)
        lyTo(dy * LABEL_PULL * falloff)
      } else {
        xTo(0); yTo(0); lxTo(0); lyTo(0)
      }
    }

    document.addEventListener("mousemove", handleMove)
    return () => document.removeEventListener("mousemove", handleMove)
  }, [disabled])

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {onBack ? (
        <button
          onClick={onBack}
          className="c-back"
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", padding: "4px 0" }}
        >
          ← Back
        </button>
      ) : <div />}
      <button
        ref={btnRef}
        onClick={onNext}
        disabled={disabled}
        className="c-btn-magnetic"
        style={{
          background: "rgba(255,255,255,0.92)",
          color: "#111",
          border: "none",
          borderRadius: 999,
          padding: "13px 32px",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "var(--font-inter)",
          letterSpacing: "-0.01em",
          opacity: disabled ? 0.5 : 1,
          willChange: "transform",
          position: "relative",
        }}
      >
        <span ref={labelRef} style={{ display: "inline-block", willChange: "transform" }}>{nextLabel}</span>
      </button>
    </div>
  )
}
