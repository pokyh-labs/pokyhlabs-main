"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import gsap from "gsap"
import { translations, type Lang, type TranslationKey } from "./translations"

type LanguageContextValue = {
  lang: Lang
  switchLanguage: (newLang: Lang) => void
  alternates: Record<string, string> | null
  setAlternates: (alts: Record<string, string> | null) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "DE",
  switchLanguage: () => {},
  alternates: null,
  setAlternates: () => {},
})

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang?: Lang
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [alternates, setAlternates] = useState<Record<string, string> | null>(null)

  // URL is source of truth: params.lang is lowercase ('de'|'en'|'it')
  const urlLang = typeof params?.lang === "string"
    ? (params.lang.toUpperCase() as Lang)
    : null

  const [lang, setLang] = useState<Lang>(urlLang ?? initialLang ?? "DE")

  // Sync whenever the URL segment changes (client-side navigation)
  useEffect(() => {
    if (urlLang) {
      setLang(urlLang)
    }
  }, [urlLang])

  const switchLanguage = useCallback(
    (newLang: Lang) => {
      if (newLang === lang) return

      const lowercaseLang = newLang.toLowerCase()

      // Determine target path
      let nextPath: string
      if (alternates && alternates[lowercaseLang]) {
        // Blog detail page: use the registered per-language slug
        nextPath = `/${lowercaseLang}/blog/${alternates[lowercaseLang]}`
      } else {
        // Generic: replace the [lang] segment (index 1) in the pathname
        const segments = pathname.split('/')
        segments[1] = lowercaseLang
        nextPath = segments.join('/')
      }

      // Write cookie so middleware remembers the preference
      try {
        document.cookie = `pokyh-lang=${lowercaseLang}; max-age=31536000; path=/; samesite=lax`
      } catch {}

      // Write localStorage as an additional hint
      try {
        localStorage.setItem("pokyh-lang", newLang)
      } catch {}

      const el = wrapperRef.current
      if (!el) {
        router.push(nextPath)
        return
      }

      // Kill any in-flight transition
      tlRef.current?.kill()
      const tl = gsap.timeline()
      tlRef.current = tl
      tl.to(el, { opacity: 0, y: 6, duration: 0.18, ease: "power2.in" })
        .call(() => {
          router.push(nextPath)
        })
        .to(el, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" })
    },
    [lang, pathname, router, alternates]
  )

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, alternates, setAlternates }}>
      <div ref={wrapperRef}>
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
