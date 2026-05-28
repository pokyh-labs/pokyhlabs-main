import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import DatenschutzContent from "@/components/legal/DatenschutzContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Datenschutzerklärung / Privacy Policy",
    description: "Informationen zur Verarbeitung personenbezogener Daten auf pokyh.studio gemäß DSGVO.",
    alternates: {
      canonical: `${siteConfig.url}/${lang}/datenschutz`,
      languages: {
        de: `${siteConfig.url}/de/datenschutz`,
        en: `${siteConfig.url}/en/datenschutz`,
        it: `${siteConfig.url}/it/datenschutz`,
        "x-default": `${siteConfig.url}/de/datenschutz`,
      },
    },
  }
}

export default function DatenschutzPage() {
  return <DatenschutzContent />
}
