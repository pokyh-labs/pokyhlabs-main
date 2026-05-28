import type { Metadata } from "next"
import { siteConfig } from "@/lib/seo.config"
import CookieRichtlinieContent from "@/components/legal/CookieRichtlinieContent"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: "Cookie-Richtlinie / Cookie Policy",
    description: "Übersicht der auf pokyh.studio verwendeten Cookies und Speichermechanismen.",
    alternates: {
      canonical: `${siteConfig.url}/${lang}/cookie-richtlinie`,
      languages: {
        de: `${siteConfig.url}/de/cookie-richtlinie`,
        en: `${siteConfig.url}/en/cookie-richtlinie`,
        it: `${siteConfig.url}/it/cookie-richtlinie`,
        "x-default": `${siteConfig.url}/de/cookie-richtlinie`,
      },
    },
  }
}

export default function CookieRichtliniePage() {
  return <CookieRichtlinieContent />
}
