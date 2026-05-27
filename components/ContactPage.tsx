"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
gsap.registerPlugin(ScrollTrigger)

type Step = 1 | 2 | 3 | 4 | 5
type VisualStep = { n: number; label: string }

const HOSTING_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 22, height: 22 }}>
    <rect x="2" y="4" width="16" height="5" rx="1.5" />
    <rect x="2" y="11" width="16" height="5" rx="1.5" />
    <circle cx="15" cy="6.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.5" r=".7" fill="currentColor" stroke="none" />
  </svg>
)

type ServiceCard = { id: string; label: string; description: string; chip: string | null; icon: React.ReactNode }

const ALL_SERVICES: ServiceCard[] = [
  {
    id: "website",
    label: "Website",
    description: "Company site, online shop, or landing page",
    chip: null,
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
    label: "Mobile App",
    description: "An app for iPhone and / or Android",
    chip: null,
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
    description: "We run your site / app on our servers — SSL & monitoring",
    chip: "€20/mo",
    icon: HOSTING_ICON,
  },
]

const APP_PLATFORMS = [
  { id: "both",    label: "Both" },
  { id: "ios",     label: "iPhone (iOS)" },
  { id: "android", label: "Android" },
]

// Four steps for the normal flow (was five — Company + Deadline merged into "Details").
const STEPS: VisualStep[] = [
  { n: 1, label: "Services" },
  { n: 2, label: "Project" },
  { n: 3, label: "Details" },
  { n: 4, label: "Contact" },
]

const HOSTING_STEPS: VisualStep[] = [
  { n: 1, label: "Services" },
  { n: 2, label: "Hosting" },
  { n: 4, label: "Contact" },
]

// Friendly categories for non-technical users. The tech-stack list is hidden behind an "Advanced" toggle.
const HOSTING_CATEGORIES = [
  { id: "website",   label: "Website" },
  { id: "shop",      label: "Online Shop" },
  { id: "webapp",    label: "Web App / Tool" },
  { id: "wordpress", label: "WordPress" },
  { id: "other",     label: "Other / Not sure" },
]

const HOSTING_STACKS = [
  { id: "nodejs",    label: "Node.js" },
  { id: "nextjs",    label: "Next.js" },
  { id: "react",     label: "React" },
  { id: "vue",       label: "Vue.js" },
  { id: "nuxt",      label: "Nuxt.js" },
  { id: "angular",   label: "Angular" },
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
  const [appPlatform, setAppPlatform] = useState<"ios" | "android" | "both">("both")
  const [showAdvancedStack, setShowAdvancedStack] = useState(false)
  const [description, setDescription] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [company, setCompany] = useState("")
  const [deadline, setDeadline] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [hostingCategory, setHostingCategory] = useState<string>("")
  const [hostingStack, setHostingStack] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const hasWebsite = services.includes("website")
  const hasApp = services.includes("app")
  const hasHosting = services.includes("hosting")
  const isHostingOnly = services.length > 0 && services.every(s => s === "hosting")
  const discountPercent =
    (hasWebsite && hasApp && hasHosting) ? 15 :
    (hasWebsite && hasApp) ? 10 :
    (hasWebsite && hasHosting) ? 5 : 0
  const visibleSteps = isHostingOnly ? HOSTING_STEPS : STEPS

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })
    ;(window as unknown as { __lenis?: unknown }).__lenis = lenis
    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
    lenis.on("scroll", ScrollTrigger.update)

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

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      if (document.body.contains(cursor)) document.body.removeChild(cursor)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      cancelAnimationFrame(rafId)
      lenis.destroy()
      delete (window as unknown as { __lenis?: unknown }).__lenis
    }
  }, [])

  const toggleService = useCallback((id: string) => {
    setServices(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      if (!next.includes("website")) setInclude3d(false)
      if (!next.includes("hosting")) {
        setHostingCategory("")
        setHostingStack([])
        setShowAdvancedStack(false)
      }
      if (next.includes("app") && !prev.includes("app")) {
        setAppPlatform("both")
      }
      return next
    })
    setErrors(e => ({ ...e, services: "", hostingCategory: "" }))
  }, [])

  const toggleHostingStack = useCallback((id: string) => {
    setHostingStack(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }, [])

  const selectHostingCategory = useCallback((id: string) => {
    setHostingCategory(id)
    setErrors(e => ({ ...e, hostingCategory: "" }))
  }, [])

  // Smoothly bring the form section back to the top of the viewport on every step transition,
  // so each new step starts cleanly aligned regardless of where the user had scrolled.
  const scrollToForm = () => {
    const formEl = formRef.current
    if (!formEl) return
    const lenis = (window as unknown as {
      __lenis?: { scrollTo: (target: HTMLElement, opts?: { duration?: number; offset?: number }) => void }
    }).__lenis
    if (lenis) lenis.scrollTo(formEl, { duration: 1.0, offset: 0 })
    else formEl.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goNext = () => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (services.length === 0) e.services = "Please select at least one service."
      else if (services.includes("hosting") && !hostingCategory) e.hostingCategory = "Please pick a project type for your hosting."
    }
    if (step === 2 && isHostingOnly && !repoUrl.trim()) {
      e.repoUrl = "Please share a link to your project."
    }
    if (step === 4) {
      if (!name.trim()) e.name = "Your name is required."
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address."
    }
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    if (isHostingOnly && step === 2) { setStep(4); requestAnimationFrame(scrollToForm); return }
    setStep(s => (s + 1) as Step)
    requestAnimationFrame(scrollToForm)
  }

  const goBack = () => {
    setErrors({})
    if (isHostingOnly && step === 4) { setStep(2); requestAnimationFrame(scrollToForm); return }
    setStep(s => (s - 1) as Step)
    requestAnimationFrame(scrollToForm)
  }

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Your name is required."
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address."
    if (Object.keys(e).length) { setErrors(e); return }

    const finalServices = services.includes("website") && include3d
      ? [...services, "threejs"]
      : services

    const descParts: string[] = []
    if (discountPercent > 0) {
      const combo = [
        hasWebsite && "Website",
        hasApp && "App",
        hasHosting && "Hosting",
      ].filter(Boolean).join(" + ")
      descParts.push(`Bundle: ${combo} (${discountPercent}% off development${hasHosting ? ", hosting fixed at €20/mo" : ""})`)
    }
    if (hasApp) {
      const platformLabel = appPlatform === "both" ? "iOS & Android" : appPlatform === "ios" ? "iOS" : "Android"
      descParts.push(`App Platform: ${platformLabel}`)
    }
    if (hasHosting && hostingCategory) {
      const catLabel = HOSTING_CATEGORIES.find(c => c.id === hostingCategory)?.label
      if (catLabel) descParts.push(`Hosting type: ${catLabel}`)
    }
    if (hasHosting && hostingStack.length > 0) {
      descParts.push(`Tech stack: ${hostingStack.join(", ")}`)
    }
    if (isHostingOnly && repoUrl.trim()) descParts.push(`Project link: ${repoUrl.trim()}`)
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
      setStep(5)
      requestAnimationFrame(scrollToForm)
    } catch {
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = visibleSteps.findIndex(s => s.n === step)
  const totalSteps = visibleSteps.length

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
        .platform-pill { transition: border-color 0.18s, background 0.18s, color 0.18s, transform 0.15s; cursor:pointer; }
        .platform-pill:hover { transform: translateY(-1px); }
        .hosting-expand-btn { transition: color 0.18s, opacity 0.18s; cursor:pointer; }
        .hosting-expand-btn:hover { opacity: 0.85; }
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
            <span className="contact-line" data-text="Let's build" style={{ display: "block" }}>
              Let&apos;s build
            </span>
            <span className="contact-line" data-text="something." style={{ display: "block" }}>
              something.
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
            Tell us about your idea — no tech knowledge needed. It takes about 2 minutes,
            and we&apos;ll get back to you within 24 hours with a clear next step.
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
            Reply within 24h
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
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 2 }}>

          {/* Step indicator */}
          {step < 5 && (
            <div ref={stepIndicatorRef} style={{ marginBottom: "clamp(44px,8vh,80px)" }}>
              {/* Progress label */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)" }}>
                  {visibleSteps[stepIndex]?.label}
                </span>
              </div>
              {/* Progress dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {visibleSteps.map((s, i) => {
                  const done = i < stepIndex
                  const active = i === stepIndex
                  return (
                    <div
                      key={s.n}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 999,
                        background: done ? "rgba(255,255,255,0.65)" : active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)",
                        transition: "background 0.35s ease",
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          <div key={step}>
            {step === 1 && (
              <StepServices
                services={services}
                include3d={include3d}
                onToggle={toggleService}
                onToggle3d={() => setInclude3d(v => !v)}
                hostingCategory={hostingCategory}
                onSelectCategory={selectHostingCategory}
                hostingStack={hostingStack}
                onToggleStack={toggleHostingStack}
                appPlatform={appPlatform}
                onPlatformChange={setAppPlatform}
                showAdvancedStack={showAdvancedStack}
                onToggleAdvancedStack={() => setShowAdvancedStack(v => !v)}
                discountPercent={discountPercent}
                error={errors.services}
                errorHostingCategory={errors.hostingCategory}
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
            {step === 3 && !isHostingOnly && (
              <StepDetails
                company={company} onChangeCompany={setCompany}
                deadline={deadline} onChangeDeadline={setDeadline}
                onBack={goBack} onNext={goNext}
              />
            )}
            {step === 4 && (
              <StepContact
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                services={services}
                hasWebsite={hasWebsite}
                hasApp={hasApp}
                hasHosting={hasHosting}
                include3d={include3d}
                appPlatform={appPlatform}
                discountPercent={discountPercent}
                errors={errors}
                submitting={submitting}
                submitError={errors.submit}
                onBack={goBack}
                onSubmit={handleSubmit}
              />
            )}
            {step === 5 && <StepSuccess name={name} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 1: Services ─────────────────────────────────────────────── */
function StepServices({ services, include3d, onToggle, onToggle3d, hostingCategory, onSelectCategory, hostingStack, onToggleStack, appPlatform, onPlatformChange, showAdvancedStack, onToggleAdvancedStack, discountPercent, error, errorHostingCategory, onNext }: {
  services: string[]; include3d: boolean
  onToggle: (id: string) => void; onToggle3d: () => void
  hostingCategory: string; onSelectCategory: (id: string) => void
  hostingStack: string[]; onToggleStack: (id: string) => void
  appPlatform: string; onPlatformChange: (p: "ios" | "android" | "both") => void
  showAdvancedStack: boolean; onToggleAdvancedStack: () => void
  discountPercent: number
  error?: string; errorHostingCategory?: string; onNext: () => void
}) {
  const containerRef     = useRef<HTMLDivElement>(null)
  const threeDRowRef     = useRef<HTMLDivElement>(null)
  const appRowRef        = useRef<HTMLDivElement>(null)
  const hostingRowRef    = useRef<HTMLDivElement>(null)
  const advancedStackRef = useRef<HTMLDivElement>(null)
  const discountRef      = useRef<HTMLDivElement>(null)

  const websiteSelected = services.includes("website")
  const hostingSelected = services.includes("hosting")
  const appSelected     = services.includes("app")
  const hasAnyService   = services.length > 0
  const showDiscount    = discountPercent > 0

  const prevWebsite  = useRef(websiteSelected)
  const prevApp      = useRef(appSelected)
  const prevHosting  = useRef(hostingSelected)
  const prevAdvanced = useRef(showAdvancedStack)
  const prevDiscount = useRef(showDiscount)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']",       { autoAlpha: 0, y: 24 })
      gsap.set("[data-a='section-label']", { autoAlpha: 0, y: 14 })
      gsap.set("[data-a='card']",          { autoAlpha: 0, y: 50, scale: 0.92, rotateX: -30, filter: "blur(12px)" })
      gsap.set("[data-a='nav']",           { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      // Always start expandable rows hidden so they animate in cleanly (including on Back navigation)
      gsap.set(threeDRowRef.current,     { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(appRowRef.current,        { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(hostingRowRef.current,    { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(advancedStackRef.current, { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(discountRef.current,      { autoAlpha: 0, height: 0, overflow: "hidden" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      tl.to("[data-a='heading']",       { autoAlpha: 1, y: 0, duration: 0.5 })
        .to("[data-a='section-label']", { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.25")
        .to("[data-a='card']",          { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.08, ease: "expo.out" }, "-=0.25")
        .to("[data-a='nav']",           { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.4")
        .call(() => {
          // Staggered expand for any rows already selected (e.g. pressing Back from a later step)
          let d = 0
          const expandDelayed = (el: HTMLElement | null) => {
            if (!el) return
            gsap.fromTo(el,
              { height: 0, autoAlpha: 0 },
              { height: "auto", autoAlpha: 1, duration: 0.4, ease: "power3.out", clearProps: "height,overflow", delay: d }
            )
            d += 0.07
          }
          if (websiteSelected)   expandDelayed(threeDRowRef.current)
          if (appSelected)       expandDelayed(appRowRef.current)
          if (hostingSelected)   expandDelayed(hostingRowRef.current)
          if (showAdvancedStack) expandDelayed(advancedStackRef.current)
          if (showDiscount)      expandDelayed(discountRef.current)
        }, [], "-=0.3")

      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92) {
          tl.play()
        } else {
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            onEnter: () => tl.play(),
          })
        }
      }
    }, containerRef)

    return () => ctx.revert()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const expand = (el: HTMLElement | null) => {
    if (!el) return
    gsap.fromTo(el, { height: 0, autoAlpha: 0 }, {
      height: "auto", autoAlpha: 1, duration: 0.42, ease: "power3.out",
      clearProps: "height,overflow",
    })
  }
  const collapse = (el: HTMLElement | null, dur = 0.3) => {
    if (!el) return
    gsap.to(el, { height: 0, autoAlpha: 0, duration: dur, ease: "power2.in", onStart: () => { el.style.overflow = "hidden" } })
  }

  // Website (3D) row
  useEffect(() => {
    if (prevWebsite.current === websiteSelected) return
    prevWebsite.current = websiteSelected
    if (websiteSelected) expand(threeDRowRef.current)
    else collapse(threeDRowRef.current)
  }, [websiteSelected])

  // App platform row
  useEffect(() => {
    if (prevApp.current === appSelected) return
    prevApp.current = appSelected
    if (appSelected) expand(appRowRef.current)
    else collapse(appRowRef.current)
  }, [appSelected])

  // Hosting row
  useEffect(() => {
    if (prevHosting.current === hostingSelected) return
    prevHosting.current = hostingSelected
    if (hostingSelected) expand(hostingRowRef.current)
    else collapse(hostingRowRef.current)
  }, [hostingSelected])

  // Advanced stack expand
  useEffect(() => {
    if (prevAdvanced.current === showAdvancedStack) return
    prevAdvanced.current = showAdvancedStack
    const el = advancedStackRef.current
    if (!el) return
    if (showAdvancedStack) {
      const pills = el.querySelectorAll<HTMLElement>("[data-pill]")
      gsap.set(pills, { autoAlpha: 0, y: 14, scale: 0.7, filter: "blur(8px)" })
      gsap.fromTo(el, { height: 0, autoAlpha: 0 }, {
        height: "auto", autoAlpha: 1, duration: 0.4, ease: "power3.out",
        clearProps: "height,overflow",
        onComplete: () => {
          gsap.to(pills, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.5, stagger: { each: 0.025, from: "start" }, ease: "expo.out" })
        },
      })
    } else collapse(el)
  }, [showAdvancedStack])

  // Discount banner
  useEffect(() => {
    if (prevDiscount.current === showDiscount) return
    prevDiscount.current = showDiscount
    const el = discountRef.current
    if (!el) return
    if (showDiscount) {
      const icon = el.querySelector<HTMLElement>("[data-discount='icon']")
      const text = el.querySelectorAll<HTMLElement>("[data-discount='text']")
      gsap.set(icon, { autoAlpha: 0, scale: 0.4, rotate: -40, filter: "blur(8px)" })
      gsap.set(text, { autoAlpha: 0, x: -14, filter: "blur(6px)" })
      gsap.fromTo(el, { height: 0, autoAlpha: 0, scale: 0.96 }, {
        height: "auto", autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)",
        clearProps: "height,overflow,scale",
        onComplete: () => {
          const tl = gsap.timeline()
          tl.to(icon, { autoAlpha: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 0.6, ease: "back.out(2)" })
            .to(text, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.45, stagger: 0.08, ease: "power3.out" }, "-=0.4")
        },
      })
    } else collapse(el, 0.25)
  }, [showDiscount])

  const discountLabel =
    discountPercent === 15 ? "Save 15% on development" :
    discountPercent === 10 ? "Save 10% on development" :
    "Save 5% on development"

  const discountSub =
    discountPercent === 15
      ? "Website + App + Hosting — full bundle. 15% off development, plus hosting fixed at €20/mo."
      : discountPercent === 10
      ? "Website + App together — 10% off the development cost."
      : "Website + Hosting together — 5% off development, hosting fixed at €20/mo."

  const rowLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-mono)",
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    marginBottom: "0.75rem",
  }

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="01" title="What can we build?" sub="Pick one or combine — we'll handle the rest." />
      </div>

      <p data-a="section-label" style={{
        fontFamily: "var(--font-dm-mono)",
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        marginBottom: "0.85rem",
      }}>
        Choose your services
      </p>

      {/* Unified 3-card service grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 12,
        marginBottom: "1.25rem",
        perspective: 1200,
      }}>
        {ALL_SERVICES.map(svc => {
          const active = services.includes(svc.id)
          return (
            <button
              key={svc.id}
              data-a="card"
              onClick={() => onToggle(svc.id)}
              className="svc-btn"
              style={{
                background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${active ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 16,
                padding: "1.3rem 1.3rem 1.2rem",
                color: "#fff",
                position: "relative",
                minHeight: 158,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.95rem" }}>
                <div style={{ color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)", transition: "color 0.18s" }}>
                  {svc.icon}
                </div>
                {active ? (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.88)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                      <polyline points="2,6 5,9 10,3" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </div>
                ) : svc.chip ? (
                  <span style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 999,
                    padding: "3px 9px",
                    lineHeight: 1.1,
                  }}>
                    {svc.chip}
                  </span>
                ) : null}
              </div>
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.95rem",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: active ? "#fff" : "rgba(255,255,255,0.68)",
                marginBottom: "0.3rem",
                transition: "color 0.18s",
              }}>
                {svc.label}
              </div>
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.78rem",
                lineHeight: 1.5,
                color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
                transition: "color 0.18s",
              }}>
                {svc.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Unified configuration panel — CSS-transitioned border/bg, GSAP-animated rows inside */}
      <div style={{
        borderRadius: 16,
        border: `1px solid ${hasAnyService ? "rgba(255,255,255,0.08)" : "transparent"}`,
        background: hasAnyService ? "rgba(255,255,255,0.025)" : "transparent",
        marginBottom: hasAnyService ? "1.25rem" : 0,
        overflow: "hidden",
        transition: "border-color 0.35s ease, background-color 0.35s ease, margin-bottom 0.35s ease",
      }}>
        {/* Website — 3D add-on */}
        <div ref={threeDRowRef} style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.3rem" }}>
            <p style={rowLabelStyle}>Website</p>
            <button
              onClick={onToggle3d}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#fff",
                textAlign: "left",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: `1.5px solid ${include3d ? "rgba(89,61,248,0.7)" : "rgba(255,255,255,0.24)"}`,
                background: include3d ? "rgba(89,61,248,0.25)" : "transparent",
                display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.18s",
              }}>
                {include3d && (
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                    <polyline points="2,6 5,9 10,3" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: include3d ? "#c4b5fd" : "rgba(255,255,255,0.82)",
                  transition: "color 0.18s",
                }}>
                  Add 3D animations
                </div>
                <div style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.32)",
                  marginTop: 2,
                }}>
                  Eye-catching effects that make your site stand out
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile App — platform */}
        <div ref={appRowRef} style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.3rem" }}>
            <p style={rowLabelStyle}>Mobile App &middot; Which platform?</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {APP_PLATFORMS.map(p => {
                const active = appPlatform === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => onPlatformChange(p.id as "ios" | "android" | "both")}
                    className="platform-pill"
                    style={{
                      background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 999,
                      padding: "7px 18px",
                      color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "0.82rem",
                      fontWeight: active ? 600 : 400,
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    {active && (
                      <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8, flexShrink: 0 }}>
                        <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
                      </svg>
                    )}
                    {p.label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.74rem", color: "rgba(255,255,255,0.3)", marginTop: "0.65rem" }}>
              &ldquo;Both&rdquo; means one app that works on iPhone and Android — cheaper than two separate apps.
            </p>
          </div>
        </div>

        {/* Hosting — project type */}
        <div ref={hostingRowRef} style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.3rem" }}>
            <p style={rowLabelStyle}>Hosting &middot; What kind of project?</p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.32)", lineHeight: 1.5, marginBottom: "0.8rem" }}>
              Pick the closest match — we&apos;ll figure out the technical side.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {HOSTING_CATEGORIES.map(cat => {
                const active = hostingCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    data-pill="true"
                    onClick={() => onSelectCategory(active ? "" : cat.id)}
                    className="platform-pill"
                    style={{
                      background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(255,255,255,0.30)" : errorHostingCategory ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 999,
                      padding: "7px 18px",
                      color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "0.82rem",
                      fontWeight: active ? 600 : 400,
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    {active && (
                      <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8, flexShrink: 0 }}>
                        <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
                      </svg>
                    )}
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {errorHostingCategory && <ErrorMsg msg={errorHostingCategory} style={{ marginTop: "0.7rem" }} />}

            <button
              onClick={onToggleAdvancedStack}
              className="hosting-expand-btn"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                marginTop: "0.95rem",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-dm-mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {showAdvancedStack ? "Hide tech options" : "I know the tech stack"}
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 9, height: 9, transform: showAdvancedStack ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>
                <polyline points="2,4 6,8 10,4" strokeLinecap="round" />
              </svg>
            </button>

            <div ref={advancedStackRef} style={{ overflow: "hidden" }}>
              <div style={{ paddingTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {HOSTING_STACKS.map(stack => {
                  const active = hostingStack.includes(stack.id)
                  return (
                    <button
                      key={stack.id}
                      data-pill="true"
                      onClick={() => onToggleStack(stack.id)}
                      className="platform-pill"
                      style={{
                        background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 999,
                        padding: "6px 14px",
                        color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)",
                        fontFamily: "var(--font-inter)",
                        fontSize: "0.78rem",
                        fontWeight: active ? 500 : 400,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {stack.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount banner */}
      <div ref={discountRef} style={{ overflow: "hidden", height: 0 }}>
        <div style={{
          background: "rgba(89,61,248,0.07)",
          border: "1px solid rgba(89,61,248,0.22)",
          borderRadius: 12,
          padding: "0.95rem 1.15rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div data-discount="icon" style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(89,61,248,0.15)",
            border: "1px solid rgba(89,61,248,0.28)",
            display: "grid", placeItems: "center", flexShrink: 0,
            willChange: "transform, filter, opacity",
          }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="rgba(167,139,250,0.85)" strokeWidth={1.4} style={{ width: 18, height: 18 }}>
              <path d="M9 2l1.5 4.5H15l-3.5 2.5L13 13.5 9 11l-4 2.5 1.5-4.5L3 6.5h4.5z" />
            </svg>
          </div>
          <div>
            <p data-discount="text" style={{ fontFamily: "var(--font-inter)", fontSize: "0.92rem", fontWeight: 600, color: "rgba(167,139,250,0.95)", letterSpacing: "-0.01em", willChange: "transform, filter, opacity" }}>
              {discountLabel}
            </p>
            <p data-discount="text" style={{ fontFamily: "var(--font-inter)", fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.45, willChange: "transform, filter, opacity" }}>
              {discountSub}
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorMsg msg={error} style={{ marginBottom: "1.5rem" }} />}
      <div data-a="nav"><NavRow onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 2 (Hosting-only): Hosting details + project link ──────── */
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
      tl.to("[data-a='heading']",  { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='pricing']",  { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }, "-=0.3")
        .to("[data-a='field']",    { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 }, "-=0.4")
        .to("[data-a='nav']",      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")

      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92) tl.play()
        else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => tl.play() })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const features = [
    "Full setup & deployment — we handle it",
    "SSL certificate (HTTPS) — free, included",
    "24/7 uptime monitoring",
    "Custom domain support",
  ]

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="02" title="Hosting details." sub="We handle the technical side — you just share your files." />
      </div>

      <div data-a="pricing" style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 18,
        padding: "1.6rem 1.7rem",
        marginBottom: "2rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.35rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 8 }}>
              Hosting plan
            </p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", fontWeight: 300, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>
              €20
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.01em", marginLeft: 6 }}>/ month</span>
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
            color: "rgba(255,255,255,0.5)",
          }}>
            Everything included
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.3rem" }}>
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
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", letterSpacing: "-0.01em" }}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div data-a="field" style={{ marginBottom: error ? "0.5rem" : "3rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "0.65rem" }}>
          Link to your project
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={e => onChangeRepo(e.target.value)}
          placeholder="https://github.com/your-username/your-project"
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
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8rem", color: "rgba(255,255,255,0.28)", marginTop: "0.6rem", lineHeight: 1.5 }}>
          GitHub repo, a ZIP file, or any other link — we&apos;ll take it from there.
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
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")

      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92) tl.play()
        else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => tl.play() })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="02" title="Tell us about your project." sub="Optional — but the more we know, the more accurate our quote." /></div>
      <div data-a="field">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="What are you building? Who is it for? Any examples or references you like? Don't worry about technical details — just describe it like you'd explain it to a friend."
          rows={7}
          className="c-input"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "1.2rem 1.3rem",
            color: "rgba(255,255,255,0.85)",
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

/* ── Step 3: Details (Company + Deadline combined) ───────────────── */
function StepDetails({ company, onChangeCompany, deadline, onChangeDeadline, onBack, onNext }: {
  company: string; onChangeCompany: (v: string) => void
  deadline: string; onChangeDeadline: (v: string) => void
  onBack: () => void; onNext: () => void
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
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.12, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")

      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92) tl.play()
        else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => tl.play() })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="03" title="A few quick details." sub="Both fields are optional — skip anything you're not sure about." />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3rem" }}>
        <div data-a="field">
          <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.7rem" }}>
            Company or brand
            <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={e => onChangeCompany(e.target.value)}
            placeholder="Your company or brand name"
            className="c-input"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              padding: "0.7rem 0",
              color: "#fff",
              fontFamily: "var(--font-inter)",
              fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)")}
            onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
          />
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", marginTop: "0.55rem", lineHeight: 1.5 }}>
            Leave blank if this is a personal project.
          </p>
        </div>

        <div data-a="field">
          <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.7rem" }}>
            Target launch date
            <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>(optional)</span>
          </label>
          <style>{`
            .deadline-input::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
            .deadline-input::-webkit-inner-spin-button { display: none; }
          `}</style>
          <input
            type="date"
            value={deadline}
            min={minDate}
            onChange={e => onChangeDeadline(e.target.value)}
            className="c-input deadline-input"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              padding: "0.7rem 0",
              color: deadline ? "#fff" : "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-inter)",
              fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              boxSizing: "border-box",
              colorScheme: "dark",
            }}
            onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.38)")}
            onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
          />
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", marginTop: "0.55rem", lineHeight: 1.5 }}>
            Earliest possible is 1 week from today.
          </p>
        </div>
      </div>

      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" /></div>
    </div>
  )
}

/* ── Step 4: Contact (with summary) ───────────────────────────────── */
function StepContact({ name, setName, email, setEmail, services, hasWebsite, hasApp, hasHosting, include3d, appPlatform, discountPercent, errors, submitting, submitError, onBack, onSubmit }: {
  name: string; setName: (v: string) => void
  email: string; setEmail: (v: string) => void
  services: string[]
  hasWebsite: boolean; hasApp: boolean; hasHosting: boolean
  include3d: boolean; appPlatform: string; discountPercent: number
  errors: Record<string, string>; submitting: boolean
  submitError?: string; onBack: () => void; onSubmit: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-a='heading']", { autoAlpha: 0, y: 28, filter: "blur(10px)" })
      gsap.set("[data-a='summary']", { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='field']",   { autoAlpha: 0, y: 24, filter: "blur(10px)" })
      gsap.set("[data-a='nav']",     { autoAlpha: 0, y: 18, filter: "blur(8px)" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      tl.to("[data-a='heading']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 })
        .to("[data-a='summary']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, "-=0.3")
        .to("[data-a='field']",   { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.1, ease: "expo.out" }, "-=0.3")
        .to("[data-a='nav']",     { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, "-=0.3")

      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92) tl.play()
        else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => tl.play() })
      }
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const summaryItems: string[] = []
  if (hasWebsite) summaryItems.push(include3d ? "Website (with 3D)" : "Website")
  if (hasApp) {
    const platform = appPlatform === "both" ? "iOS & Android" : appPlatform === "ios" ? "iOS" : "Android"
    summaryItems.push(`Mobile App — ${platform}`)
  }
  if (hasHosting) summaryItems.push("Hosting — €20/mo")

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="04" title="How can we reach you?" sub="We'll reply within 24 hours with a clear next step." /></div>

      {services.length > 0 && (
        <div data-a="summary" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "1.05rem 1.25rem",
          marginBottom: "2.25rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Your request
            </p>
            {discountPercent > 0 && (
              <span style={{
                background: "rgba(89,61,248,0.14)",
                border: "1px solid rgba(89,61,248,0.32)",
                borderRadius: 999,
                padding: "3px 10px",
                fontFamily: "var(--font-dm-mono)",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(167,139,250,0.95)",
              }}>
                −{discountPercent}% bundle
              </span>
            )}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {summaryItems.map(item => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.9rem", color: "rgba(255,255,255,0.78)", letterSpacing: "-0.01em" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem", marginBottom: "3rem" }}>
        <div data-a="field">
          <UnderlineField label="Your name" value={name} onChange={setName} placeholder="Full name" error={errors.name} onEnter={onSubmit} />
        </div>
        <div data-a="field">
          <UnderlineField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@email.com" error={errors.email} onEnter={onSubmit} />
        </div>
      </div>
      {submitError && <ErrorMsg msg={submitError} style={{ marginBottom: "1.5rem" }} />}
      <div data-a="nav"><NavRow onBack={onBack} onNext={onSubmit} nextLabel={submitting ? "Sending…" : "Send request"} isFinal disabled={submitting} /></div>
    </div>
  )
}

/* ── Step 5: Success ──────────────────────────────────────────────── */
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
      <p data-a="sub" style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)", color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 3.5rem" }}>
        Your request is in. We&apos;ll get back to you within 24 hours.
      </p>
      <a
        data-a="link"
        href="/"
        style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", textDecoration: "none", transition: "color 0.2s" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)")}
      >
        ← Back to homepage
      </a>
    </div>
  )
}

/* ── Shared ──────────────────────────────────────────────────────── */
function StepHeading({ label, title, sub }: { label: string; title: string; sub: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const subRef   = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const t = titleRef.current
    if (!t) return
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
      <p ref={labelRef} style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)", marginBottom: "0.85rem", opacity: 0 }}>
        {label}
      </p>
      <h2
        ref={titleRef}
        style={{ fontSize: "clamp(1.75rem, 3.4vw, 3rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fff", fontFamily: "var(--font-inter)", marginBottom: "0.6rem", lineHeight: 1.08 }}
      >
        {title}
      </h2>
      <p ref={subRef} style={{ fontFamily: "var(--font-inter)", fontSize: "0.92rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.55, opacity: 0 }}>
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
      <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.7rem" }}>
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
          padding: "0.65rem 0",
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
  const btnRef   = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  void isFinal

  useEffect(() => {
    const btn   = btnRef.current
    const label = labelRef.current
    if (!btn || !label || disabled) return

    const xTo  = gsap.quickTo(btn,   "x", { duration: 0.55, ease: "power3.out" })
    const yTo  = gsap.quickTo(btn,   "y", { duration: 0.55, ease: "power3.out" })
    const lxTo = gsap.quickTo(label, "x", { duration: 0.45, ease: "power3.out" })
    const lyTo = gsap.quickTo(label, "y", { duration: 0.45, ease: "power3.out" })
    const ZONE = 45
    const PULL = 0.42
    const LABEL_PULL = 0.18

    const handleMove = (e: MouseEvent) => {
      const rect  = btn.getBoundingClientRect()
      const halfW = rect.width / 2
      const halfH = rect.height / 2
      const dx = e.clientX - (rect.left + halfW)
      const dy = e.clientY - (rect.top + halfH)
      const edgeX = Math.max(0, Math.abs(dx) - halfW)
      const edgeY = Math.max(0, Math.abs(dy) - halfH)
      const edgeDist = Math.hypot(edgeX, edgeY)
      if (edgeDist < ZONE) {
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
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", padding: "4px 0" }}
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
          padding: "14px 34px",
          fontSize: "0.9rem",
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
