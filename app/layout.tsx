import type { Metadata, Viewport } from "next"
import { Instrument_Serif, DM_Mono, Inter } from "next/font/google"
import "./globals.css"
import { siteConfig, structuredData } from "@/lib/seo.config"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import RevealObserver from "@/components/RevealObserver"
import SmoothScroll from "@/components/SmoothScroll"
import Analytics from "@/components/Analytics"
import CookieConsent from "@/components/CookieConsent"
import { LanguageProvider } from "@/lib/i18n/context"

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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: siteConfig.hreflang,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: ["en_US", "it_IT"],
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title.default,
    description: siteConfig.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title.default,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  verification: {
    google: siteConfig.verification.google || undefined,
    other: siteConfig.verification.bing
      ? { "msvalidate.01": siteConfig.verification.bing }
      : undefined,
  },
  icons: { icon: "/assets/logo.png", apple: "/assets/logo.png" },
}

export const viewport: Viewport = {
  themeColor: "#0c0c0c",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <html lang={siteConfig.lang} className={`${instrumentSerif.variable} ${dmMono.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* Run before anything paints:
            - disable native scroll restoration so reloads always land at top
            - force a real reload when the page is restored from bfcache or
              the user hits the back/forward button (otherwise Lenis / GSAP /
              ScrollTrigger come back in a stale state) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if('scrollRestoration' in history){history.scrollRestoration='manual';}var initial=true;window.addEventListener('pageshow',function(e){if(e.persisted){window.location.reload();}});window.addEventListener('popstate',function(){if(initial){return;}window.location.reload();});window.addEventListener('load',function(){window.scrollTo(0,0);initial=false;});}catch(_){}})();`,
          }}
        />
        {/* JSON-LD structured data belongs in <head>, not <body>, to avoid React 19 script hoisting issues */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.organization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.website) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.localBusiness) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.service) }}
        />
        {/* Speakable schema — marks key content for AI assistants & voice search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: ["h1", "h2", "h3", "[data-speakable]"],
              },
            }),
          }}
        />
      </head>
      <body>
        <LanguageProvider>
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
      </body>
    </html>
  )
}
