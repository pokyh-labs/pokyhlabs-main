import type { Metadata } from "next"
import DatenschutzContent from "@/components/legal/DatenschutzContent"

export const metadata: Metadata = {
  title: "Datenschutzerklärung / Privacy Policy",
  description: "Informationen zur Verarbeitung personenbezogener Daten auf pokyh.studio gemäß DSGVO.",
  alternates: { canonical: "/datenschutz" },
}

export default function DatenschutzPage() {
  return <DatenschutzContent />
}
