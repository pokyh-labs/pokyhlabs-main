import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import AGBContent from "@/components/legal/AGBContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "AGB / Terms & Conditions",
    description: "Allgemeine Geschäftsbedingungen für die Leistungen von pokyh.studio.",
    alternates: {
      canonical: `${siteConfig.url}/${lang}/agb`,
      languages: {
        de: `${siteConfig.url}/de/agb`,
        en: `${siteConfig.url}/en/agb`,
        it: `${siteConfig.url}/it/agb`,
        "x-default": `${siteConfig.url}/de/agb`,
      },
    },
  }
}

export default function AGBPage() {
  return <AGBContent />
}
