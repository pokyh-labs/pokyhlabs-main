export const siteConfig = {
  name: "pokyh.studio",
  url: "https://pokyh.studio",
  locale: "de_AT",
  lang: "de",

  title: {
    default: "pokyh.studio – 3D Websites & Webdesign kaufen | Digital Studio Südtirol",
    en: "pokyh.studio – Buy 3D Websites & Web Design | Digital Studio South Tyrol",
    it: "pokyh.studio – Acquista Siti Web 3D & Web Design | Studio Digitale Alto Adige",
    template: "%s | pokyh.studio",
  },

  // Primary description (DE) — used for meta tags
  description:
    "3D Websites & professionelles Webdesign kaufen bei pokyh.studio. Wir entwickeln schnelle, skalierbare und immersive Web-Erlebnisse. Digital Studio aus Südtirol.",

  // Multilingual descriptions — used in structured data & page-level overrides
  descriptions: {
    de: "3D Websites & professionelles Webdesign kaufen bei pokyh.studio. Wir entwickeln schnelle, skalierbare und immersive Web-Erlebnisse. Digital Studio aus Südtirol.",
    en: "Buy 3D websites & professional web design at pokyh.studio. We build fast, scalable, and immersive web experiences. Digital studio from South Tyrol.",
    it: "Acquista siti web 3D e web design professionale su pokyh.studio. Sviluppiamo esperienze web veloci, scalabili e immersive. Studio digitale dall'Alto Adige.",
  },

  // ─── Keywords (DE + EN + IT) ─────────────────────────────────────────────
  keywords: [
    // German — primary DACH market
    "website kaufen",
    "3d website kaufen",
    "webdesign kaufen",
    "webseite kaufen",
    "professionelle website",
    "professionelle website erstellen lassen",
    "3d webdesign",
    "3d web experience",
    "webentwicklung südtirol",
    "webdesign südtirol",
    "digital studio südtirol",
    "webdesign agentur",
    "webdesign studio",
    "immersive website",
    "moderne website",
    "website erstellen lassen",
    "software entwicklung",
    "interaktive website",
    "nextjs agentur",
    "react webdesign",
    "website preis",
    "website agentur",
    "pokyh",
    "pokyh.studio",

    // English — international market
    "buy website",
    "buy 3d website",
    "buy web design",
    "professional website",
    "custom website",
    "web design studio",
    "web development studio",
    "3d website design",
    "immersive web experience",
    "interactive website",
    "modern web design",
    "web developer south tyrol",
    "digital studio south tyrol",
    "nextjs development",
    "react development",
    "web design agency",
    "website agency",
    "3d web design studio",
    "high end web design",
    "creative web studio",

    // Italian — South Tyrol & Italian market
    "acquistare sito web",
    "sito web professionale",
    "web design alto adige",
    "sviluppo web alto adige",
    "studio digitale alto adige",
    "agenzia web",
    "sito web 3d",
    "esperienza web immersiva",
    "web design professionale",
    "sviluppo web",
    "sito web moderno",
    "creazione sito web",
    "sviluppatore web alto adige",
    "web design sudtirolo",
    "studio web alto adige",
  ],

  // ─── Google Search Console & Bing Webmaster ──────────────────────────────
  verification: {
    google: "",
    bing: "",
  },

  // ─── hreflang — all languages served from the same URL ───────────────────
  hreflang: {
    de: "https://pokyh.studio",
    en: "https://pokyh.studio",
    it: "https://pokyh.studio",
    "x-default": "https://pokyh.studio",
  },

  // ─── Social ──────────────────────────────────────────────────────────────
  social: {
    github: "https://github.com/pokyhlabs",
    email: "hello@pokyh.studio",
    discord: "",
  },

  // ─── Sitemap pages ───────────────────────────────────────────────────────
  pages: [
    { path: "/", priority: 1.0, changeFreq: "weekly" as const },
    { path: "/works", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/about", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.9, changeFreq: "monthly" as const },
  ],
}

// ─── Structured Data (JSON-LD) ────────────────────────────────────────────
// All 4 schemas are injected into every page via layout.tsx.

export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "pokyh.studio",
    alternateName: ["pokyh studio", "pokyhlabs", "pokyh"],
    url: siteConfig.url,
    logo: `${siteConfig.url}/assets/logo.png`,
    description: siteConfig.descriptions.de,
    email: siteConfig.social.email,
    foundingDate: "2024",
    areaServed: ["DE", "AT", "CH", "IT"],
    knowsLanguage: ["de", "en", "it"],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.social.email,
      contactType: "customer service",
      availableLanguage: [
        { "@type": "Language", name: "German" },
        { "@type": "Language", name: "English" },
        { "@type": "Language", name: "Italian" },
      ],
    },
    sameAs: [siteConfig.social.github].filter(Boolean),
  },

  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.descriptions.de,
    inLanguage: ["de", "en", "it"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },

  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    alternateName: ["pokyh studio", "Digital Studio Südtirol", "Digital Studio South Tyrol", "Studio Digitale Alto Adige"],
    description: siteConfig.descriptions.de,
    url: siteConfig.url,
    logo: `${siteConfig.url}/assets/logo.png`,
    image: `${siteConfig.url}/opengraph-image`,
    email: siteConfig.social.email,
    priceRange: "€€",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressRegion: "Südtirol / Alto Adige",
      addressCountry: "IT",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "46.4983",
      longitude: "11.3548",
    },
    serviceType: "Web Development",
    knowsLanguage: ["de", "en", "it"],
    areaServed: [
      { "@type": "Country", name: "Germany" },
      { "@type": "Country", name: "Austria" },
      { "@type": "Country", name: "Switzerland" },
      { "@type": "Country", name: "Italy" },
    ],
  },

  service: {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "3D Website & Webdesign Entwicklung | Web Design & Development | Sviluppo Web & Design",
    description: siteConfig.descriptions.de,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    areaServed: ["DE", "AT", "CH", "IT"],
    serviceType: "Web Development",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Web Development Services",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "3D Websites / 3D Websites / Siti Web 3D",
          description:
            "Immersive 3D Web-Erlebnisse · Immersive 3D web experiences · Esperienze web 3D immersive",
        },
        {
          "@type": "OfferCatalog",
          name: "Webdesign / Web Design / Web Design",
          description:
            "Professionelles Webdesign auf Mass · Professional custom web design · Web design professionale su misura",
        },
        {
          "@type": "OfferCatalog",
          name: "Webentwicklung / Web Development / Sviluppo Web",
          description:
            "Schnelle und skalierbare Webanwendungen · Fast and scalable web applications · Applicazioni web veloci e scalabili",
        },
      ],
    },
  },
}
