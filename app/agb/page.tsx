import type { Metadata } from "next"
import AGBContent from "@/components/legal/AGBContent"

export const metadata: Metadata = {
  title: "AGB / Terms & Conditions",
  description: "Allgemeine Geschäftsbedingungen für die Leistungen von pokyh.studio.",
  alternates: { canonical: "/agb" },
}

export default function AGBPage() {
  return <AGBContent />
}
