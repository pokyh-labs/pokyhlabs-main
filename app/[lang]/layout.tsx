import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Instrument_Serif, DM_Mono, Inter } from "next/font/google"
import { siteConfig } from "@/lib/seo.config"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import RevealObserver from "@/components/RevealObserver"
import SmoothScroll from "@/components/SmoothScroll"
import Analytics from "@/components/Analytics"
import CookieConsent from "@/components/CookieConsent"
import { LanguageProvider } from "@/lib/i18n/context"
import type { Lang } from "@/lib/i18n/translations"

const SUPPORTED_LANGS = ["de", "en", "it"] as const
type SupportedLang = (typeof SUPPORTED_LANGS)[number]

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
})

const dmMono = DM_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
})

const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    alternates: {
      canonical: `${siteConfig.url}/${lang}`,
      languages: {
        de: `${siteConfig.url}/de`,
        en: `${siteConfig.url}/en`,
        it: `${siteConfig.url}/it`,
        "x-default": `${siteConfig.url}/de`,
      },
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!SUPPORTED_LANGS.includes(lang as SupportedLang)) {
    notFound()
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const initialLang = lang.toUpperCase() as Lang

  return (
    <div
      lang={lang}
      className={`${instrumentSerif.variable} ${dmMono.variable} ${inter.variable}`}
    >
      <LanguageProvider initialLang={initialLang}>
        <SmoothScroll />
        <Header />
        <main id="main-content">
          {children}
        </main>
        <Footer />
        <RevealObserver />
        <Analytics gaId={gaId} />
        <CookieConsent />
      </LanguageProvider>
    </div>
  )
}
