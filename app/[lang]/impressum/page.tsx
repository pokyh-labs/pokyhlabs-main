import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import ImpressumContent from "@/components/legal/ImpressumContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Impressum / Legal Notice",
    description: "Anbieterkennzeichnung und rechtliche Angaben zu pokyh.studio.",
    alternates: {
      canonical: `${siteConfig.url}/${lang}/impressum`,
      languages: {
        de: `${siteConfig.url}/de/impressum`,
        en: `${siteConfig.url}/en/impressum`,
        it: `${siteConfig.url}/it/impressum`,
        "x-default": `${siteConfig.url}/de/impressum`,
      },
    },
  }
}

export default function ImpressumPage() {
  return <ImpressumContent />
}
