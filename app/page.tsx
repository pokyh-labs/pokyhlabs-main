import type { Metadata } from "next"
import ParticleCanvas from "@/components/ParticleCanvas"
import Header from "@/components/Header"
import Headline from "@/components/Headline"
import RailLine from "@/components/RailLine"
import Socials from "@/components/Socials"
import ScrollIndicator from "@/components/ScrollIndicator"
import HomeClientWrapper from "@/components/HomeClientWrapper"
import { siteConfig } from "@/lib/seo.config"

export const metadata: Metadata = {
  title: {
    absolute: siteConfig.title.default,
  },
  description: siteConfig.descriptions.de,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: siteConfig.url,
    languages: {
      de: siteConfig.url,
      en: siteConfig.url,
      it: siteConfig.url,
      "x-default": siteConfig.url,
    },
  },
  openGraph: {
    url: siteConfig.url,
    title: siteConfig.title.default,
    description: siteConfig.descriptions.de,
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
  },
}

export default function Home() {
  return (
    <HomeClientWrapper>
      <ParticleCanvas />
      <div className="ui" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Header />
        <Headline />
        <RailLine />
        <Socials />
        <ScrollIndicator />
      </div>
    </HomeClientWrapper>
  )
}
