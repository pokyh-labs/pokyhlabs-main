import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import WiderrufContent from "@/components/legal/WiderrufContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Widerrufsbelehrung / Right of Withdrawal",
    description: "Widerrufsrecht für Verbraucher und Muster-Widerrufsformular.",
    alternates: {
      canonical: `${siteConfig.url}/${lang}/widerruf`,
      languages: {
        de: `${siteConfig.url}/de/widerruf`,
        en: `${siteConfig.url}/en/widerruf`,
        it: `${siteConfig.url}/it/widerruf`,
        "x-default": `${siteConfig.url}/de/widerruf`,
      },
    },
  }
}

export default function WiderrufPage() {
  return <WiderrufContent />
}
