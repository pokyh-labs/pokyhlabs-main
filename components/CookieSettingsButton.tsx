"use client"

import type { CSSProperties } from "react"
import { openConsentSettings } from "@/lib/consent"

// Wieder-Öffnen des Cookie-Banners. Wird im Footer und auf der
// Cookie-Richtlinie-Seite verwendet.
export default function CookieSettingsButton({
  style,
  className,
  children = "Cookie-Einstellungen",
  onMouseEnter,
  onMouseLeave,
}: {
  style?: CSSProperties
  className?: string
  children?: React.ReactNode
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", ...style }}
    >
      {children}
    </button>
  )
}
