import type { Metadata } from "next"
import ImpressumContent from "@/components/legal/ImpressumContent"

export const metadata: Metadata = {
  title: "Impressum / Legal Notice",
  description: "Anbieterkennzeichnung und rechtliche Angaben zu pokyh.studio.",
  alternates: { canonical: "/impressum" },
}

export default function ImpressumPage() {
  return <ImpressumContent />
}
