"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useT } from "@/lib/i18n/context"
// Register GSAP plugins globally before any component code runs
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

type ServiceCardBase = { id: string; chip: string | null; icon: React.ReactNode }
type ServiceCard = ServiceCardBase & { label: string; description: string }

const ALL_SERVICES_BASE: ServiceCardBase[] = [
  {
    id: "website",
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
    id: "software-automation",
    chip: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 22, height: 22 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
  {
    id: "hosting",
    chip: "€20/mo",
    icon: HOSTING_ICON,
  },
]

// Friendly categories for non-technical users. The tech-stack list is hidden behind an "Advanced" toggle.

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
  const t = useT()

  const STEPS: VisualStep[] = [
    { n: 1, label: t("contact_step_services") },
    { n: 2, label: t("contact_step_project") },
    { n: 3, label: t("contact_step_details") },
    { n: 4, label: t("contact_step_contact") },
  ]

  const HOSTING_STEPS: VisualStep[] = [
    { n: 1, label: t("contact_step_services") },
    { n: 2, label: t("contact_step_hosting") },
    { n: 4, label: t("contact_step_contact") },
  ]

  const HOSTING_CATEGORIES = [
    { id: "website",   label: t("contact_hosting_website") },
    { id: "shop",      label: t("contact_hosting_shop") },
    { id: "webapp",    label: t("contact_hosting_webapp") },
    { id: "wordpress", label: t("contact_hosting_wordpress") },
    { id: "other",     label: t("contact_hosting_other") },
  ]

  const headlineRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const stepIndicatorRef = useRef<HTMLDivElement>(null)
  // Honeypot — a hidden field real users never see. Bots auto-fill it, which
  // lets us drop the submission (also re-checked server-side).
  const botFieldRef = useRef<HTMLInputElement>(null)

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

    if (headlineRef.current) {
      const lines = headlineRef.current.querySelectorAll<HTMLSpanElement>(".contact-line")
      lines.forEach((line, li) => {
        const text = (line.getAttribute("data-text") ?? "").trim()
        line.textContent = ""
        let idx = 0
        // Chars are grouped per word (nowrap) so the headline can only break
        // between words, never mid-word, at the huge works-style font size.
        text.split(" ").filter(Boolean).forEach((word, wi) => {
          if (wi > 0) {
            const sp = document.createElement("span")
            sp.className = "sp"
            line.appendChild(sp)
          }
          const w = document.createElement("span")
          w.style.display = "inline-block"
          w.style.whiteSpace = "nowrap"
          for (const ch of word) {
            const s = document.createElement("span")
            s.className = "ch"
            s.textContent = ch
            s.style.setProperty("--d", `${li * 120 + idx * 35}ms`)
            w.appendChild(s)
            idx++
          }
          line.appendChild(w)
        })
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
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
      if (services.length === 0) e.services = t("contact_err_select_service")
      else if (services.includes("hosting") && !hostingCategory) e.hostingCategory = t("contact_err_hosting_type")
    }
    if (step === 2 && isHostingOnly && !repoUrl.trim()) {
      e.repoUrl = t("contact_err_repo")
    }
    if (step === 4) {
      if (!name.trim()) e.name = t("contact_err_name")
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("contact_err_email")
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
    if (!name.trim()) e.name = t("contact_err_name")
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("contact_err_email")
    if (Object.keys(e).length) { setErrors(e); return }

    // Honeypot tripped → bot. Show the success screen so it learns nothing, but
    // never hit the API.
    if (botFieldRef.current?.value) { setStep(5); requestAnimationFrame(scrollToForm); return }

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
          company_website: botFieldRef.current?.value || "",
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErrors({ submit: (d as { error?: string }).error ?? t("contact_err_generic") })
        return
      }
      setStep(5)
      requestAnimationFrame(scrollToForm)
    } catch {
      setErrors({ submit: t("contact_err_network") })
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = visibleSteps.findIndex(s => s.n === step)
  const totalSteps = visibleSteps.length

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        @keyframes heroMouse {
          0%, 100% { opacity: 0.45; transform: translateY(0); }
          50%      { opacity: 0.9; transform: translateY(3px); }
        }
        .svc-row { cursor: pointer; transition: background 0.25s ease; -webkit-tap-highlight-color: transparent; }
        .svc-row:hover { background: rgba(255,255,255,0.035); }
        .svc-row:focus-visible { outline: 2px solid rgba(89,61,248,0.55); outline-offset: -2px; }
        .svc-config { padding: 0 1.3rem 1.3rem calc(1.3rem + 88px); }
        @media (max-width: 640px) {
          .svc-config { padding-left: 1.3rem; }
          .svc-idx { display: none; }
        }
        @media (hover: none), (pointer: coarse) { .svc-kbd-hint { display: none !important; } }
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
            — pokyh.studio / Contact —
          </div>
          <h1
            ref={headlineRef}
            suppressHydrationWarning
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 500,
              fontSize: "clamp(48px, 10vw, 150px)",
              lineHeight: 0.96,
              letterSpacing: "-0.05em",
              margin: 0,
              color: "#0a0a0a",
              userSelect: "none",
            }}
          >
            <span className="contact-line" data-text={t("contact_hero_title")} style={{ display: "block" }}>
              {t("contact_hero_title")}
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
            maxWidth: 560,
            animation: "chIn 0.6s cubic-bezier(0.22,0.61,0.36,1) 900ms both",
          }}>
            {t("contact_hero_sub")}
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

          {/* Honeypot — off-screen, not focusable, hidden from screen readers.
              Real users never fill it; bots do, and get silently dropped. */}
          <input
            ref={botFieldRef}
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          />

          {/* Step indicator */}
          {step < 5 && (
            <div ref={stepIndicatorRef} style={{ marginBottom: "clamp(44px,8vh,80px)" }}>
              {/* Progress label */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  {t("contact_step_of").replace("{current}", String(stepIndex + 1)).replace("{total}", String(totalSteps))}
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
                        background: done ? "rgba(139,117,250,0.9)" : active ? "rgba(139,117,250,0.45)" : "rgba(255,255,255,0.08)",
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
const INK = "#593df8"
const INK_SOFT = "#a78bfa"
const INK_FAINT = "#c4b5fd"

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
  const t = useT()

  const SERVICES: ServiceCard[] = ALL_SERVICES_BASE.map(svc => ({
    ...svc,
    label: t(svc.id === "website" ? "contact_svc_website_label" : svc.id === "app" ? "contact_svc_app_label" : svc.id === "software-automation" ? "contact_svc_software_label" : "contact_svc_hosting_label"),
    description: t(svc.id === "website" ? "contact_svc_website_desc" : svc.id === "app" ? "contact_svc_app_desc" : svc.id === "software-automation" ? "contact_svc_software_desc" : "contact_svc_hosting_desc"),
  }))

  const APP_PLATFORMS = [
    { id: "both",    label: t("contact_platform_both") },
    { id: "ios",     label: t("contact_platform_ios") },
    { id: "android", label: t("contact_platform_android") },
  ]

  const HOSTING_CATEGORIES = [
    { id: "website",   label: t("contact_hosting_website") },
    { id: "shop",      label: t("contact_hosting_shop") },
    { id: "webapp",    label: t("contact_hosting_webapp") },
    { id: "wordpress", label: t("contact_hosting_wordpress") },
    { id: "other",     label: t("contact_hosting_other") },
  ]

  const containerRef     = useRef<HTMLDivElement>(null)
  const listRef          = useRef<HTMLDivElement>(null)
  const threeDRowRef     = useRef<HTMLDivElement>(null)
  const appRowRef        = useRef<HTMLDivElement>(null)
  const hostingRowRef    = useRef<HTMLDivElement>(null)
  const advancedStackRef = useRef<HTMLDivElement>(null)
  const discountRef      = useRef<HTMLDivElement>(null)

  const websiteSelected = services.includes("website")
  const hostingSelected = services.includes("hosting")
  const appSelected     = services.includes("app")
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
      gsap.set("[data-a='list']",          { autoAlpha: 0, y: 26 })
      gsap.set("[data-a='row']",           { autoAlpha: 0, x: -22 })
      gsap.set("[data-a='nav']",           { autoAlpha: 0, y: 18 })

      // Always start expandable rows hidden so they animate in cleanly (including on Back navigation)
      gsap.set(threeDRowRef.current,     { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(appRowRef.current,        { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(hostingRowRef.current,    { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(advancedStackRef.current, { autoAlpha: 0, height: 0, overflow: "hidden" })
      gsap.set(discountRef.current,      { autoAlpha: 0, height: 0, overflow: "hidden" })

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      tl.to("[data-a='heading']",       { autoAlpha: 1, y: 0, duration: 0.5 })
        .to("[data-a='section-label']", { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.25")
        .to("[data-a='list']",          { autoAlpha: 1, y: 0, duration: 0.55 }, "-=0.2")
        .to("[data-a='row']",           { autoAlpha: 1, x: 0, duration: 0.55, stagger: 0.07, ease: "expo.out" }, "-=0.35")
        .to("[data-a='nav']",           { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.3")
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
      if (icon) gsap.set(icon, { autoAlpha: 0, scale: 0.4, rotate: -40, filter: "blur(8px)" })
      gsap.set(text, { autoAlpha: 0, x: -14, filter: "blur(6px)" })
      gsap.fromTo(el, { height: 0, autoAlpha: 0, scale: 0.96 }, {
        height: "auto", autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)",
        clearProps: "height,overflow,scale",
        onComplete: () => {
          const tl = gsap.timeline()
          if (icon) tl.to(icon, { autoAlpha: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 0.6, ease: "back.out(2)" })
          tl.to(text, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.45, stagger: 0.08, ease: "power3.out" }, icon ? "-=0.4" : 0)
        },
      })
    } else collapse(el, 0.25)
  }, [showDiscount])

  // QOL: keys 1–4 toggle services, Enter continues (only while nothing else is focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      const n = Number(e.key)
      if (n >= 1 && n <= ALL_SERVICES_BASE.length) {
        onToggle(ALL_SERVICES_BASE[n - 1].id)
        return
      }
      if (e.key === "Enter" && (!el || el === document.body)) onNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onToggle, onNext])

  // QOL: shake the list when validation fails
  useEffect(() => {
    if (!error || !listRef.current) return
    gsap.fromTo(listRef.current, { x: 0 }, { x: -8, duration: 0.06, repeat: 5, yoyo: true, ease: "power1.inOut", clearProps: "x" })
  }, [error])

  const discountLabel =
    discountPercent === 15 ? t("contact_discount_15_label") :
    discountPercent === 10 ? t("contact_discount_10_label") :
    t("contact_discount_5_label")

  const discountSub =
    discountPercent === 15
      ? t("contact_discount_15_sub")
      : discountPercent === 10
      ? t("contact_discount_10_sub")
      : t("contact_discount_5_sub")

  const rowLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-mono)",
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    marginBottom: "0.75rem",
  }

  const kbdStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-mono)",
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 4,
    padding: "1px 5px",
    lineHeight: 1.4,
  }

  const pillStyle = (active: boolean, hasError = false): React.CSSProperties => ({
    background: active ? "rgba(89,61,248,0.16)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? "rgba(89,61,248,0.5)" : hasError ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 999,
    padding: "7px 16px",
    color: active ? INK_FAINT : "rgba(255,255,255,0.45)",
    fontFamily: "var(--font-inter)",
    fontSize: "0.82rem",
    fontWeight: active ? 600 : 400,
    letterSpacing: "-0.01em",
    display: "flex",
    alignItems: "center",
    gap: 7,
  })

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="01" title={t("contact_step1_title")} sub={t("contact_step1_sub")} />
      </div>

      <div data-a="section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", gap: 12 }}>
        <p style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
        }}>
          {t("contact_choose_services")}
        </p>
        <span className="svc-kbd-hint" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-dm-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
          <kbd style={kbdStyle}>1</kbd>
          <span>–</span>
          <kbd style={kbdStyle}>4</kbd>
          <span style={{ marginLeft: 3 }}>{t("contact_kbd_hint")}</span>
        </span>
      </div>

      {/* Service rows — editorial list with inline configuration per row */}
      <div
        data-a="list"
        ref={listRef}
        role="group"
        aria-label={t("contact_choose_services")}
        style={{
          border: `1px solid ${error ? "rgba(255,80,80,0.35)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 18,
          background: "rgba(255,255,255,0.02)",
          overflow: "hidden",
          marginBottom: "1.25rem",
          transition: "border-color 0.3s ease",
        }}
      >
        {SERVICES.map((svc, i) => {
          const active = services.includes(svc.id)
          return (
            <div
              key={svc.id}
              data-a="row"
              style={{
                position: "relative",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                background: active ? "rgba(89,61,248,0.055)" : "transparent",
                transition: "background 0.3s ease",
              }}
            >
              <button
                role="checkbox"
                aria-checked={active}
                onClick={() => onToggle(svc.id)}
                className="svc-row"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "1.15rem 1.3rem",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  textAlign: "left",
                }}
              >
                <span className="svc-idx" style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.12em", color: active ? INK_SOFT : "rgba(255,255,255,0.28)", width: 20, flexShrink: 0, transition: "color 0.25s ease" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  width: 40, height: 40, borderRadius: 11,
                  border: `1px solid ${active ? "rgba(89,61,248,0.45)" : "rgba(255,255,255,0.09)"}`,
                  background: active ? "rgba(89,61,248,0.14)" : "rgba(255,255,255,0.03)",
                  display: "grid", placeItems: "center", flexShrink: 0,
                  color: active ? INK_FAINT : "rgba(255,255,255,0.4)",
                  transition: "color 0.25s ease, border-color 0.25s ease, background 0.25s ease",
                }}>
                  {svc.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.015em", color: active ? "#fff" : "rgba(255,255,255,0.72)", transition: "color 0.25s ease" }}>
                    {svc.label}
                  </span>
                  <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.78rem", lineHeight: 1.45, color: active ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0.3)", marginTop: 3, transition: "color 0.25s ease" }}>
                    {svc.description}
                  </span>
                </span>
                {svc.chip && (
                  <span style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active ? INK_FAINT : "rgba(255,255,255,0.38)",
                    background: active ? "rgba(89,61,248,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "rgba(89,61,248,0.35)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 999,
                    padding: "3px 9px",
                    lineHeight: 1.1,
                    flexShrink: 0,
                    transition: "color 0.25s ease, border-color 0.25s ease, background 0.25s ease",
                  }}>
                    {svc.chip}
                  </span>
                )}
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `1.5px solid ${active ? INK : "rgba(255,255,255,0.16)"}`,
                  background: active ? INK : "transparent",
                  display: "grid", placeItems: "center", flexShrink: 0,
                  transition: "background 0.22s ease, border-color 0.22s ease",
                }}>
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9, opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(0.4)", transition: "opacity 0.16s ease, transform 0.26s cubic-bezier(0.34,1.56,0.64,1)" }}>
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {/* Website — 3D add-on */}
              {svc.id === "website" && (
                <div ref={threeDRowRef} style={{ overflow: "hidden" }}>
                  <div className="svc-config">
                    <button
                      onClick={onToggle3d}
                      style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "#fff", textAlign: "left" }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: `1.5px solid ${include3d ? "rgba(89,61,248,0.7)" : "rgba(255,255,255,0.24)"}`,
                        background: include3d ? "rgba(89,61,248,0.25)" : "transparent",
                        display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.18s",
                      }}>
                        {include3d && (
                          <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                            <polyline points="2,6 5,9 10,3" stroke={INK_SOFT} strokeWidth={2} strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      <span>
                        <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em", color: include3d ? INK_FAINT : "rgba(255,255,255,0.82)", transition: "color 0.18s" }}>
                          {t("contact_3d_label")}
                        </span>
                        <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                          {t("contact_3d_desc")}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile App — platform */}
              {svc.id === "app" && (
                <div ref={appRowRef} style={{ overflow: "hidden" }}>
                  <div className="svc-config">
                    <p style={rowLabelStyle}>{t("contact_app_platform_q")}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {APP_PLATFORMS.map(p => {
                        const pActive = appPlatform === p.id
                        return (
                          <button
                            key={p.id}
                            onClick={() => onPlatformChange(p.id as "ios" | "android" | "both")}
                            className="platform-pill"
                            style={pillStyle(pActive)}
                          >
                            {pActive && (
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
                      {t("contact_platform_both_hint")}
                    </p>
                  </div>
                </div>
              )}

              {/* Hosting — project type + optional tech stack */}
              {svc.id === "hosting" && (
                <div ref={hostingRowRef} style={{ overflow: "hidden" }}>
                  <div className="svc-config">
                    <p style={rowLabelStyle}>{t("contact_hosting_q")}</p>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.32)", lineHeight: 1.5, marginBottom: "0.8rem" }}>
                      {t("contact_hosting_pick")}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {HOSTING_CATEGORIES.map(cat => {
                        const cActive = hostingCategory === cat.id
                        return (
                          <button
                            key={cat.id}
                            data-pill="true"
                            onClick={() => onSelectCategory(cActive ? "" : cat.id)}
                            className="platform-pill"
                            style={pillStyle(cActive, Boolean(errorHostingCategory))}
                          >
                            {cActive && (
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
                      {showAdvancedStack ? t("contact_hide_tech") : t("contact_show_tech")}
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 9, height: 9, transform: showAdvancedStack ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>
                        <polyline points="2,4 6,8 10,4" strokeLinecap="round" />
                      </svg>
                    </button>

                    <div ref={advancedStackRef} style={{ overflow: "hidden" }}>
                      <div style={{ paddingTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {HOSTING_STACKS.map(stack => {
                          const sActive = hostingStack.includes(stack.id)
                          return (
                            <button
                              key={stack.id}
                              data-pill="true"
                              onClick={() => onToggleStack(stack.id)}
                              className="platform-pill"
                              style={{ ...pillStyle(sActive), padding: "6px 14px", fontSize: "0.78rem", fontWeight: sActive ? 500 : 400 }}
                            >
                              {stack.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Discount banner */}
      <div ref={discountRef} style={{ overflow: "hidden", height: 0 }}>
        <div style={{
          background: "rgba(89,61,248,0.08)",
          border: "1px solid rgba(89,61,248,0.26)",
          borderRadius: 14,
          padding: "1rem 1.2rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div data-discount="icon" style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: "rgba(89,61,248,0.18)",
            border: "1px solid rgba(89,61,248,0.3)",
            display: "grid", placeItems: "center",
            color: INK_FAINT,
            fontFamily: "var(--font-dm-mono)",
            fontSize: 11,
            letterSpacing: "0.02em",
            willChange: "transform, filter, opacity",
          }}>
            −{discountPercent}%
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
      <div data-a="nav">
        <NavRow
          onNext={onNext}
          nextLabel={t("contact_continue")}
          meta={services.length > 0 ? t("contact_selected_count").replace("{count}", String(services.length)) : undefined}
        />
      </div>
    </div>
  )
}

/* ── Step 2 (Hosting-only): Hosting details + project link ──────── */
function StepHosting({ repoUrl, onChangeRepo, error, onBack, onNext }: {
  repoUrl: string; onChangeRepo: (v: string) => void
  error?: string; onBack: () => void; onNext: () => void
}) {
  const t = useT()
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
    t("contact_hosting_feat1"),
    t("contact_hosting_feat2"),
    t("contact_hosting_feat3"),
    t("contact_hosting_feat4"),
  ]

  return (
    <div ref={containerRef}>
      <div data-a="heading">
        <StepHeading label="02" title={t("contact_hosting_title")} sub={t("contact_hosting_sub")} />
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
              {t("contact_hosting_plan")}
            </p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", fontWeight: 300, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>
              €20
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.01em", marginLeft: 6 }}>{t("contact_per_month")}</span>
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
            {t("contact_all_included")}
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
          {t("contact_repo_label")}
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
          {t("contact_repo_hint")}
        </p>
        {error && <ErrorMsg msg={error} style={{ marginTop: "0.4rem" }} />}
      </div>
      {error && <div style={{ marginBottom: "2.5rem" }} />}

      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel={t("contact_continue")} /></div>
    </div>
  )
}

/* ── Step 2: Description ──────────────────────────────────────────── */
function StepDescription({ value, onChange, onBack, onNext }: {
  value: string; onChange: (v: string) => void; onBack: () => void; onNext: () => void
}) {
  const t = useT()
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
      <div data-a="heading"><StepHeading label="02" title={t("contact_step2_title")} sub={t("contact_step2_sub")} /></div>
      <div data-a="field">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t("contact_desc_placeholder")}
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
      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel={t("contact_continue")} /></div>
    </div>
  )
}

/* ── Step 3: Details (Company + Deadline combined) ───────────────── */
function StepDetails({ company, onChangeCompany, deadline, onChangeDeadline, onBack, onNext }: {
  company: string; onChangeCompany: (v: string) => void
  deadline: string; onChangeDeadline: (v: string) => void
  onBack: () => void; onNext: () => void
}) {
  const t = useT()
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
        <StepHeading label="03" title={t("contact_step3_title")} sub={t("contact_step3_sub")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3rem" }}>
        <div data-a="field">
          <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.7rem" }}>
            {t("contact_company_label")}
            <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>{t("contact_optional")}</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={e => onChangeCompany(e.target.value)}
            placeholder={t("contact_company_ph")}
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
            {t("contact_company_hint")}
          </p>
        </div>

        <div data-a="field">
          <label style={{ display: "block", fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: "0.7rem" }}>
            {t("contact_deadline_label")}
            <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>{t("contact_optional")}</span>
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
            {t("contact_deadline_hint")}
          </p>
        </div>
      </div>

      <div data-a="nav"><NavRow onBack={onBack} onNext={onNext} nextLabel={t("contact_continue")} /></div>
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
  const t = useT()
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
  if (hasWebsite) summaryItems.push(include3d ? t("contact_summary_website_3d") : t("contact_summary_website"))
  if (hasApp) {
    const platform = appPlatform === "both" ? "iOS & Android" : appPlatform === "ios" ? "iOS" : "Android"
    summaryItems.push(t("contact_summary_app").replace("{platform}", platform))
  }
  if (hasHosting) summaryItems.push(t("contact_summary_hosting"))

  return (
    <div ref={containerRef}>
      <div data-a="heading"><StepHeading label="04" title={t("contact_step4_title")} sub={t("contact_step4_sub")} /></div>

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
              {t("contact_your_request")}
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
          <UnderlineField label={t("contact_name_label")} value={name} onChange={setName} placeholder={t("contact_name_ph")} error={errors.name} onEnter={onSubmit} />
        </div>
        <div data-a="field">
          <UnderlineField label={t("contact_email_label")} type="email" value={email} onChange={setEmail} placeholder={t("contact_email_ph")} error={errors.email} onEnter={onSubmit} />
        </div>
      </div>
      {submitError && <ErrorMsg msg={submitError} style={{ marginBottom: "1.5rem" }} />}
      <div data-a="nav"><NavRow onBack={onBack} onNext={onSubmit} nextLabel={submitting ? t("contact_sending") : t("contact_send")} isFinal disabled={submitting} /></div>
    </div>
  )
}

/* ── Step 5: Success ──────────────────────────────────────────────── */
function StepSuccess({ name }: { name: string }) {
  const t = useT()
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
        {name ? t("contact_thanks_name").replace("{name}", name) : t("contact_thanks")}
      </h2>
      <p data-a="sub" style={{ fontFamily: "var(--font-inter)", fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)", color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 3.5rem" }}>
        {t("contact_success_sub")}
      </p>
      <a
        data-a="link"
        href="/"
        style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", textDecoration: "none", transition: "color 0.2s" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.32)")}
      >
        {t("contact_back_home")}
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

function NavRow({ onBack, onNext, nextLabel, isFinal, disabled, meta }: {
  onBack?: () => void; onNext: () => void; nextLabel: string; isFinal?: boolean; disabled?: boolean; meta?: string
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
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {meta && (
        <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(167,139,250,0.8)" }}>
          {meta}
        </span>
      )}
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
    </div>
  )
}
