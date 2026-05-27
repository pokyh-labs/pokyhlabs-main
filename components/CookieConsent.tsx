"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { getConsent, setConsent, CONSENT_EVENT } from "@/lib/consent"
import { useT } from "@/lib/i18n/context"

const BEIGE = "#e4e2dc"
const PURPLE = "#593df8"
const BLACK = "#0c0c0c"

export default function CookieConsent() {
  const t = useT()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const hadConsentRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    const existing = getConsent()
    if (existing) {
      hadConsentRef.current = true
      setAnalytics(existing.analytics)
    } else {
      setVisible(true) // Erstbesuch → Einwilligung erforderlich
    }

    // Wieder-Öffnen über Footer-Button / Cookie-Richtlinie
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { open?: boolean } | undefined
      if (detail?.open) {
        setAnalytics(getConsent()?.analytics ?? false)
        setShowSettings(true)
        setVisible(true)
      }
    }
    window.addEventListener(CONSENT_EVENT, onEvent)
    return () => window.removeEventListener(CONSENT_EVENT, onEvent)
  }, [])

  // Escape schließt nur, wenn bereits eine Einwilligung existiert.
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hadConsentRef.current) close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible])

  function close() {
    setVisible(false)
    setShowSettings(false)
  }

  function acceptAll() {
    setConsent(true)
    hadConsentRef.current = true
    close()
  }
  function rejectAll() {
    setConsent(false)
    hadConsentRef.current = true
    close()
  }
  function saveSelection() {
    setConsent(analytics)
    hadConsentRef.current = true
    close()
  }

  if (!mounted || !visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("cookie_aria")}
      style={overlay}
    >
      <div style={card}>
        <p style={kicker}>{t("cookie_title")}</p>

        {!showSettings ? (
          <>
            <p style={bodyText}>
              {t("cookie_body")}{" "}
              <a href="/datenschutz" style={inlineLink}>{t("cookie_privacy_link")}</a>{" "}
              {t("cookie_and")}{" "}
              <a href="/cookie-richtlinie" style={inlineLink}>{t("cookie_policy_link")}</a>.
            </p>
            <div style={btnRow}>
              <button type="button" style={btnPrimary} onClick={acceptAll}>
                {t("cookie_accept_all")}
              </button>
              <button type="button" style={btnOutline} onClick={rejectAll}>
                {t("cookie_reject_all")}
              </button>
              <button type="button" style={btnGhost} onClick={() => setShowSettings(true)}>
                {t("cookie_settings_btn")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "0.25rem 0 1.25rem" }}>
              <Category
                title={t("cookie_necessary")}
                desc={t("cookie_necessary_desc")}
                checked
                disabled
              />
              <Category
                title={t("cookie_analytics")}
                desc={t("cookie_analytics_desc")}
                checked={analytics}
                disabled={false}
                onChange={setAnalytics}
              />
            </div>
            <div style={btnRow}>
              <button type="button" style={btnPrimary} onClick={saveSelection}>
                {t("cookie_save")}
              </button>
              <button type="button" style={btnOutline} onClick={acceptAll}>
                {t("cookie_accept_all")}
              </button>
              <button type="button" style={btnGhost} onClick={rejectAll}>
                {t("cookie_reject_all")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Category({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  disabled: boolean
  onChange?: (v: boolean) => void
}) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: disabled ? "default" : "pointer" }}>
      <span style={{ ...toggleTrack, background: checked ? PURPLE : "rgba(12,12,12,0.18)", opacity: disabled ? 0.55 : 1 }}>
        <span style={{ ...toggleThumb, transform: checked ? "translateX(18px)" : "translateX(0)" }} />
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", margin: 0, cursor: disabled ? "default" : "pointer" }}
          aria-label={title}
        />
      </span>
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: BLACK, fontFamily: "var(--font-inter), sans-serif" }}>
          {title}
        </span>
        <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.5, color: "rgba(12,12,12,0.66)", marginTop: 2, fontFamily: "var(--font-inter), sans-serif" }}>
          {desc}
        </span>
      </span>
    </label>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100000,
  display: "flex",
  justifyContent: "center",
  padding: "clamp(0.75rem, 2vw, 1.5rem)",
  pointerEvents: "none",
}

const card: CSSProperties = {
  pointerEvents: "auto",
  width: "min(560px, 100%)",
  background: BEIGE,
  color: BLACK,
  border: "1px solid rgba(12,12,12,0.14)",
  borderRadius: 18,
  boxShadow: "0 18px 50px rgba(12,12,12,0.22)",
  padding: "clamp(1.1rem, 2.5vw, 1.6rem)",
  fontFamily: "var(--font-inter), sans-serif",
}

const kicker: CSSProperties = {
  fontFamily: "var(--font-dm-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.14em",
  color: PURPLE,
  margin: "0 0 0.6rem",
}

const bodyText: CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.6,
  color: "rgba(12,12,12,0.8)",
  margin: "0 0 1.25rem",
}

const inlineLink: CSSProperties = {
  color: PURPLE,
  textDecoration: "underline",
  textUnderlineOffset: 2,
}

const btnRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
}

const btnBase: CSSProperties = {
  fontFamily: "var(--font-inter), sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.01em",
  padding: "0.6rem 1.15rem",
  borderRadius: 999,
  cursor: "pointer",
  transition: "opacity .2s ease, transform .2s ease",
  border: "1px solid transparent",
}

const btnPrimary: CSSProperties = {
  ...btnBase,
  background: BLACK,
  color: BEIGE,
}

const btnOutline: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: BLACK,
  borderColor: "rgba(12,12,12,0.32)",
}

const btnGhost: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: "rgba(12,12,12,0.7)",
}

const toggleTrack: CSSProperties = {
  position: "relative",
  flexShrink: 0,
  width: 38,
  height: 20,
  borderRadius: 999,
  transition: "background .2s ease",
  marginTop: 2,
}

const toggleThumb: CSSProperties = {
  position: "absolute",
  top: 2,
  left: 2,
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: BEIGE,
  transition: "transform .2s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
}
