import type { Metadata } from "next"
import WiderrufContent from "@/components/legal/WiderrufContent"

export const metadata: Metadata = {
  title: "Widerrufsbelehrung / Right of Withdrawal",
  description: "Widerrufsrecht für Verbraucher und Muster-Widerrufsformular.",
  alternates: { canonical: "/widerruf" },
}

export default function WiderrufPage() {
  return <WiderrufContent />
}
