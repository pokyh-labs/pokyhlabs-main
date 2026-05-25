import type { Metadata } from "next"
import { siteConfig, breadcrumbSchema } from "@/lib/seo.config"
import AboutPage from "@/components/AboutPage"

const teamSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${siteConfig.url}/about`,
  name: "Über pokyh.studio – Digital Studio Südtirol",
  description: "Zwei Entwickler aus Südtirol bauen 3D Websites, Webdesign, Next.js Projekte und Managed Hosting.",
  about: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    foundingDate: "2024",
    member: [
      {
        "@type": "Person",
        name: "plattnericus",
        jobTitle: "Co-Founder & Developer",
        worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      },
      {
        "@type": "Person",
        name: "ryhox",
        jobTitle: "Co-Founder & Developer",
        worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      },
    ],
  },
}

export const metadata: Metadata = {
  // Title with template: "Über uns – Digital Studio Südtirol | pokyh.studio" = 50 chars ✓
  title: "Über uns – Digital Studio Südtirol",
  description:
    "Zwei Entwickler aus Südtirol – gegründet 2024. pokyh.studio baut 3D Websites, React/Next.js Projekte & managed Hosting für Kunden in DE, AT, CH und IT.",
  keywords: [
    // DE
    "pokyh studio team",
    "webdesign agentur südtirol team",
    "web developer südtirol",
    "digital studio gründer südtirol",
    "software entwickler südtirol",
    "web agentur südtirol über uns",
    "nextjs entwickler südtirol",
    "react developer südtirol",
    // EN
    "pokyh studio about",
    "web developers south tyrol",
    "digital studio founders south tyrol",
    "web design team italy",
    "software engineers south tyrol",
    "about web agency south tyrol",
    // IT
    "team studio digitale alto adige",
    "sviluppatori web alto adige",
    "chi siamo agenzia web",
    "fondatori studio digitale",
    "web developer alto adige",
    // Brand
    "plattnericus",
    "ryhox",
    "pokyhlabs",
    "pokyh studio about",
  ],
  alternates: {
    canonical: `${siteConfig.url}/about`,
    languages: {
      de: `${siteConfig.url}/about`,
      en: `${siteConfig.url}/about`,
      it: `${siteConfig.url}/about`,
      "x-default": `${siteConfig.url}/about`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/about`,
    title: "Über uns – Digital Studio Südtirol | pokyh.studio",
    description:
      "Zwei Entwickler aus Südtirol, gegründet 2024. Wir bauen 3D Websites, React/Next.js Projekte & managed Hosting für Kunden in DE, AT, CH und IT.",
    locale: "de_AT",
    alternateLocale: ["en_US", "it_IT"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "pokyh.studio – Über uns" }],
  },
}

export default function About() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: siteConfig.url },
              { name: "Über uns", url: `${siteConfig.url}/about` },
            ])
          ),
        }}
      />
      <AboutPage />
    </>
  )
}
