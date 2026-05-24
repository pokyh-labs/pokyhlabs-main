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

    // German — Hosting & Website Builder
    "website hosting",
    "webhosting günstig",
    "hosting südtirol",
    "website mieten",
    "managed hosting",
    "hosting kaufen",
    "server hosting",
    "wordpress hosting",
    "e-commerce hosting",
    "website erstellen",
    "homepage erstellen lassen",
    "webseite aufbauen",
    "website builder",
    "homepage baukasten",

    // German — Location long-tail
    "webdesign bozen",
    "webdesign meran",
    "webdesign innsbruck",
    "webdesign münchen",
    "website agentur deutschland",
    "website agentur italien",

    // English — Hosting & Builder
    "website hosting south tyrol",
    "cheap website hosting",
    "managed web hosting",
    "wordpress hosting italy",
    "buy website hosting",
    "web design agency germany",
    "web developer italy",
    "website builder south tyrol",
    "affordable web design europe",

    // Italian — Hosting & Location long-tail
    "hosting sito web",
    "hosting alto adige",
    "hosting economico",
    "hosting wordpress",
    "hosting professionale italia",
    "agenzia web bolzano",
    "agenzia web merano",
    "realizzazione sito web alto adige",
    "sito web economico",
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
    { path: "/blog", priority: 0.8, changeFreq: "daily" as const },
  ],
}

// ─── Structured Data (JSON-LD) ────────────────────────────────────────────
// All 4 schemas are injected into every page via layout.tsx.

export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "pokyh.studio",
    alternateName: [
      "pokyh studio",
      "pokyhlabs",
      "pokyh",
      "Digital Studio Südtirol",
      "Digital Studio South Tyrol",
      "Studio Digitale Alto Adige",
    ],
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/assets/logo.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.descriptions.de,
    email: siteConfig.social.email,
    foundingDate: "2024",
    numberOfEmployees: { "@type": "QuantitativeValue", value: 2 },
    areaServed: [
      { "@type": "Country", name: "Germany", sameAs: "https://www.wikidata.org/wiki/Q183" },
      { "@type": "Country", name: "Austria", sameAs: "https://www.wikidata.org/wiki/Q40" },
      { "@type": "Country", name: "Switzerland", sameAs: "https://www.wikidata.org/wiki/Q39" },
      { "@type": "Country", name: "Italy", sameAs: "https://www.wikidata.org/wiki/Q38" },
    ],
    knowsLanguage: [
      { "@type": "Language", name: "German", alternateName: "Deutsch" },
      { "@type": "Language", name: "English" },
      { "@type": "Language", name: "Italian", alternateName: "Italiano" },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.social.email,
      contactType: "customer service",
      contactOption: "TollFree",
      areaServed: ["DE", "AT", "CH", "IT"],
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
    alternateName: ["pokyhlabs", "pokyh studio", "Digital Studio Südtirol"],
    url: siteConfig.url,
    description: siteConfig.descriptions.de,
    inLanguage: ["de", "en", "it"],
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable]"],
    },
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
        {
          "@type": "OfferCatalog",
          name: "Hosting / Hosting / Hosting",
          description:
            "Verwaltetes Website-Hosting ab €20/mo · Managed website hosting from €20/mo · Hosting gestito da €20/mese",
        },
        {
          "@type": "OfferCatalog",
          name: "WordPress / WordPress / WordPress",
          description:
            "WordPress-Websites und Themes · WordPress websites and themes · Siti web WordPress e temi",
        },
        {
          "@type": "OfferCatalog",
          name: "E-Commerce / E-Commerce / E-Commerce",
          description:
            "Online-Shops und Produktseiten · Online shops and product pages · Negozi online e pagine prodotto",
        },
        {
          "@type": "OfferCatalog",
          name: "SEO / SEO / SEO",
          description:
            "Suchmaschinenoptimierung · Search engine optimization · Ottimizzazione per i motori di ricerca",
        },
      ],
    },
  },
}

// ─── BreadcrumbList helper ────────────────────────────────────────────────
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Article schema helper ────────────────────────────────────────────────
export function articleSchema(post: {
  title: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  author: string | null
  slug: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.image_url ? [post.image_url] : [`${siteConfig.url}/opengraph-image`],
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: {
      "@type": "Person",
      name: post.author ?? "pokyh.studio",
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/assets/logo.png` },
    },
    url: `${siteConfig.url}/blog/${post.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteConfig.url}/blog/${post.slug}` },
    inLanguage: ["de", "en", "it"],
  }
}

// ─── FAQPage schema (Kontaktseite) ────────────────────────────────────────
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Was kostet eine professionelle Website? / How much does a professional website cost? / Quanto costa un sito web professionale?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unsere Websites starten ab €20/Monat für Hosting. Der Preis für Entwicklung hängt vom Umfang ab – kontaktiere uns für ein individuelles Angebot. / Our websites start from €20/month for hosting. Development pricing depends on scope — contact us for a custom quote. / I nostri siti web partono da €20/mese per l'hosting. Il prezzo di sviluppo dipende dall'ambito — contattaci per un preventivo personalizzato.",
      },
    },
    {
      "@type": "Question",
      name: "Welche Dienstleistungen bietet pokyh.studio an? / What services does pokyh.studio offer? / Quali servizi offre pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir bieten: 3D Websites, professionelles Webdesign, Frontend & Backend Entwicklung, SEO, Website Hosting ab €20/mo, WordPress und E-Commerce Lösungen. / We offer: 3D websites, professional web design, frontend & backend development, SEO, hosting from €20/mo, WordPress and e-commerce solutions. / Offriamo: siti web 3D, web design professionale, sviluppo frontend & backend, SEO, hosting da €20/mese, WordPress ed e-commerce.",
      },
    },
    {
      "@type": "Question",
      name: "Bietet pokyh.studio auch Hosting an? / Does pokyh.studio offer hosting? / pokyh.studio offre anche hosting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! Wir bieten verwaltetes Website-Hosting ab €20/Monat an. / Yes! We offer managed website hosting from €20/month. / Sì! Offriamo hosting gestito a partire da €20/mese.",
      },
    },
    {
      "@type": "Question",
      name: "In welchen Sprachen arbeitet pokyh.studio? / What languages does pokyh.studio work in? / In quali lingue lavora pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir arbeiten auf Deutsch, Englisch und Italienisch. Wir sind ein Digital Studio aus Südtirol / Alto Adige. / We work in German, English and Italian. We are a digital studio from South Tyrol / Alto Adige. / Lavoriamo in tedesco, inglese e italiano. Siamo uno studio digitale dell'Alto Adige / Südtirol.",
      },
    },
    {
      "@type": "Question",
      name: "Wo ist pokyh.studio ansässig? / Where is pokyh.studio located? / Dove si trova pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir sind in Südtirol / Alto Adige, Italien ansässig und betreuen Kunden in ganz Deutschland, Österreich, der Schweiz und Italien. / We are based in South Tyrol / Alto Adige, Italy and serve clients throughout the DACH region and Italy. / Siamo con sede in Alto Adige / Südtirol, Italia, e serviamo clienti in tutta la regione DACH e in Italia.",
      },
    },
  ],
}
