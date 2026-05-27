// ── Cookie-/Einwilligungs-Verwaltung ──────────────────────────────────────────
// Framework-freie Helfer, geteilt von CookieConsent.tsx (Banner) und
// Analytics.tsx (GA4-Gating). Persistenz in localStorage, Kommunikation per
// CustomEvent auf window.

export const CONSENT_KEY = "pokyh-consent"

// Version hochzählen, wenn sich die Datenschutz-/Cookie-Richtlinie ändert.
// Gespeicherte Einwilligungen mit älterer Version gelten als ungültig → Banner
// wird erneut angezeigt.
export const CONSENT_VERSION = 1

// Event-Name für Banner ↔ Analytics-Kommunikation und zum Wieder-Öffnen.
export const CONSENT_EVENT = "pokyh-consent-change"

export interface ConsentState {
  necessary: true // immer aktiv, nicht abwählbar
  analytics: boolean
  version: number
  timestamp: string
}

// Liest die gespeicherte Einwilligung. Gibt null zurück, wenn keine vorliegt
// oder die Version veraltet ist (→ erneute Einwilligung erforderlich).
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    if (parsed.version !== CONSENT_VERSION) return null
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp || new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// Speichert die Einwilligung und benachrichtigt Listener (z. B. Analytics).
export function setConsent(analytics: boolean): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  } catch {}
  return state
}

// Öffnet den Cookie-Banner erneut (Footer-Button, Cookie-Richtlinie-Seite).
export function openConsentSettings(): void {
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { open: true } }))
  } catch {}
}
