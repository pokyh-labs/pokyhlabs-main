"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { getConsent, CONSENT_EVENT, type ConsentState } from "@/lib/consent"

// Lädt Google Analytics 4 ausschließlich nach erteilter Analyse-Einwilligung.
// Ohne Einwilligung wird kein gtag-Script geladen und es werden keine Cookies
// gesetzt (strikter Opt-in-Ansatz, DSGVO-konform).
export default function Analytics({ gaId }: { gaId?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!gaId) return

    // Initialer Zustand aus gespeicherter Einwilligung
    setEnabled(getConsent()?.analytics === true)

    // Auf Einwilligungs-Änderungen reagieren
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<ConsentState> | { open?: boolean }
      if (detail && "analytics" in detail) {
        const granted = detail.analytics === true
        setEnabled(granted)
        if (!granted) disableGA(gaId)
      }
    }

    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [gaId])

  if (!gaId || !enabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true,page_path:window.location.pathname})`}
      </Script>
    </>
  )
}

// Deaktiviert GA und entfernt gesetzte _ga*-Cookies bei Widerruf.
function disableGA(gaId: string) {
  try {
    ;(window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true
    const host = location.hostname
    const domains = [host, `.${host}`, host.split(".").slice(-2).join(".")]
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim()
      if (name.startsWith("_ga") || name === "_gid" || name === "_gat") {
        domains.forEach((d) => {
          document.cookie = `${name}=; path=/; domain=${d}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        })
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
  } catch {}
}
