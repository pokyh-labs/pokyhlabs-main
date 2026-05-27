"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { translations, type Lang, type TranslationKey } from "./translations"

type LanguageContextValue = {
  lang: Lang
  switchLanguage: (newLang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "DE",
  switchLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("DE")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pokyh-lang") as Lang | null
      if (saved && (saved === "DE" || saved === "EN" || saved === "IT")) {
        setLang(saved)
      }
    } catch {}
  }, [])

  const switchLanguage = useCallback((newLang: Lang) => {
    if (newLang === lang) return
    const el = wrapperRef.current
    if (!el) {
      setLang(newLang)
      try { localStorage.setItem("pokyh-lang", newLang) } catch {}
      return
    }
    // Kill any in-flight transition
    tlRef.current?.kill()
    const tl = gsap.timeline()
    tlRef.current = tl
    tl.to(el, { opacity: 0, y: 6, duration: 0.18, ease: "power2.in" })
      .call(() => {
        setLang(newLang)
        try { localStorage.setItem("pokyh-lang", newLang) } catch {}
      })
      .to(el, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" })
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage }}>
      <div ref={wrapperRef} style={{ willChange: "opacity, transform" }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function useT() {
  const { lang } = useLanguage()
  return useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang]
  )
}
