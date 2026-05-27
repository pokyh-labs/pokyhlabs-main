import type { Metadata } from "next"
import CookieRichtlinieContent from "@/components/legal/CookieRichtlinieContent"

export const metadata: Metadata = {
  title: "Cookie-Richtlinie / Cookie Policy",
  description: "Übersicht der auf pokyh.studio verwendeten Cookies und Speichermechanismen.",
  alternates: { canonical: "/cookie-richtlinie" },
}

export default function CookieRichtliniePage() {
  return <CookieRichtlinieContent />
}
