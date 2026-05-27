export const siteConfig = {
  name: "pokyh.studio",
  url: "https://pokyh.studio",
  locale: "de_AT",
  lang: "de",

  title: {
    // ≤60 chars — Google truncates beyond that. Primary keyword first, brand last.
    default: "pokyh.studio – Webdesign, 3D & Hosting | Südtirol",  // 50 chars
    en:      "pokyh.studio – Web Design, 3D & Hosting | South Tyrol",
    it:      "pokyh.studio – Web Design, 3D & Hosting | Alto Adige",
    template: "%s | pokyh.studio",
  },

  // Primary description (DE) — used as global fallback meta description.
  // Target 150–160 chars; include primary keyword, location, CTA.
  description:
    "pokyh.studio – Digital Studio aus Südtirol: 3D Websites, Webdesign & Hosting ab €20/mo. React, Next.js, WordPress, Docker. Angebot innerhalb 24 Stunden.",

  // Multilingual descriptions — used in structured data & page-level overrides
  descriptions: {
    de: "pokyh.studio – Digital Studio aus Südtirol: 3D Websites, Webdesign & Hosting ab €20/mo. React, Next.js, WordPress, Docker. Angebot innerhalb 24 Stunden.",
    en: "pokyh.studio – Digital studio from South Tyrol: 3D websites, web design & hosting from €20/mo. React, Next.js, WordPress, Docker. Quote within 24 hours.",
    it: "pokyh.studio – Studio digitale dall'Alto Adige: siti web 3D, web design & hosting da €20/mese. React, Next.js, WordPress, Docker. Preventivo in 24 ore.",
  },

  // ─── Keywords (DE + EN + IT) ─────────────────────────────────────────────
  // Strategy: transactional intent first (kaufen/hire/buy), then local, then service-specific.
  // Note: Google largely ignores this tag; Bing still indexes it. Keep it clean.
  keywords: [
    // ── German: commercial intent (DACH market) ──────────────────────────
    "website kaufen",
    "webdesign kaufen",
    "3d website kaufen",
    "webseite kaufen",
    "professionelle website erstellen lassen",
    "website erstellen lassen kosten",
    "webdesign agentur südtirol",
    "webdesign studio südtirol",
    "digital studio südtirol",
    "webentwicklung südtirol",
    "webdesign südtirol preise",
    "3d webdesign",
    "3d web experience",
    "immersive website",
    "moderne website",
    "nextjs agentur",
    "react webdesign agentur",
    "website agentur",
    "website preis",
    "webdesign kosten",
    "software entwicklung südtirol",
    "pokyh",
    "pokyh.studio",
    "pokyhlabs",

    // ── German: local long-tail ───────────────────────────────────────────
    "webdesign bozen",
    "webdesign meran",
    "webdesign innsbruck",
    "webdesign münchen",
    "webdesign wien",
    "website agentur bozen",
    "website agentur tirol",
    "website agentur deutschland",
    "website agentur österreich",
    "website agentur südtirol",
    "web agentur nord",

    // ── German: hosting ───────────────────────────────────────────────────
    "website hosting",
    "webhosting günstig",
    "hosting südtirol",
    "managed hosting",
    "hosting kaufen",
    "website mieten",
    "nodejs hosting",
    "nextjs hosting",
    "react app hosten",
    "vue js hosting",
    "nuxt hosting",
    "angular hosting",
    "wordpress hosting managed",
    "php hosting",
    "laravel hosting",
    "python hosting",
    "django hosting",
    "go hosting",
    "docker hosting",
    "static website hosting",
    "svelte hosting",
    "astro hosting",
    "managed app hosting",
    "hosting für entwickler",
    "full stack hosting",

    // ── English: commercial intent ────────────────────────────────────────
    "buy website",
    "buy 3d website",
    "buy web design",
    "custom website",
    "professional website design",
    "web design studio south tyrol",
    "web development studio",
    "3d website design studio",
    "immersive web experience",
    "interactive website design",
    "nextjs development agency",
    "react development agency",
    "web design agency germany",
    "web design agency italy",
    "high end web design",
    "creative web studio",
    "web developer south tyrol",
    "digital studio south tyrol",
    "affordable web design europe",

    // ── English: hosting ──────────────────────────────────────────────────
    "managed web hosting",
    "nodejs hosting provider",
    "nextjs hosting",
    "react app hosting",
    "vue.js hosting",
    "nuxt.js hosting",
    "angular app hosting",
    "wordpress managed hosting",
    "php hosting provider",
    "laravel hosting",
    "python hosting",
    "django hosting",
    "go application hosting",
    "docker container hosting",
    "static site hosting",
    "svelte hosting",
    "astro hosting",
    "managed developer hosting",
    "website hosting south tyrol",
    "website hosting from 20 euro",

    // ── Italian: commercial intent ────────────────────────────────────────
    "acquistare sito web",
    "sito web professionale",
    "web design alto adige",
    "sviluppo web alto adige",
    "studio digitale alto adige",
    "agenzia web bolzano",
    "agenzia web merano",
    "agenzia web alto adige",
    "sito web 3d",
    "esperienza web immersiva",
    "web design professionale",
    "creazione sito web",
    "sviluppatore web alto adige",
    "realizzazione sito web alto adige",
    "sviluppo web sudtirolo",

    // ── Italian: hosting ──────────────────────────────────────────────────
    "hosting sito web",
    "hosting alto adige",
    "hosting economico",
    "hosting wordpress gestito",
    "hosting nodejs",
    "hosting nextjs",
    "hosting react",
    "hosting vue",
    "hosting php",
    "hosting laravel",
    "hosting python",
    "hosting docker",
    "hosting sito statico",
    "hosting svelte",
    "hosting astro",
    "hosting applicazioni web",
    "hosting gestito professionale",
    "hosting professionale italia",
    "hosting 20 euro mese",
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
    { path: "/",        priority: 1.0, changeFreq: "weekly"  as const },
    { path: "/works",   priority: 0.9, changeFreq: "weekly"  as const },
    { path: "/contact", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/blog",    priority: 0.8, changeFreq: "daily"   as const },
    { path: "/impressum",         priority: 0.3, changeFreq: "yearly" as const },
    { path: "/datenschutz",       priority: 0.3, changeFreq: "yearly" as const },
    { path: "/agb",               priority: 0.3, changeFreq: "yearly" as const },
    { path: "/widerruf",          priority: 0.3, changeFreq: "yearly" as const },
    { path: "/cookie-richtlinie", priority: 0.3, changeFreq: "yearly" as const },
  ],
}

// ─── Structured Data (JSON-LD) ────────────────────────────────────────────
// Injected sitewide via layout.tsx; page-specific schemas added per page.

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
      { "@type": "Country", name: "Germany",     sameAs: "https://www.wikidata.org/wiki/Q183" },
      { "@type": "Country", name: "Austria",     sameAs: "https://www.wikidata.org/wiki/Q40"  },
      { "@type": "Country", name: "Switzerland", sameAs: "https://www.wikidata.org/wiki/Q39"  },
      { "@type": "Country", name: "Italy",       sameAs: "https://www.wikidata.org/wiki/Q38"  },
    ],
    knowsLanguage: [
      { "@type": "Language", name: "German",  alternateName: "Deutsch"   },
      { "@type": "Language", name: "English"                              },
      { "@type": "Language", name: "Italian", alternateName: "Italiano"  },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.social.email,
      contactType: "customer service",
      contactOption: "TollFree",
      areaServed: ["DE", "AT", "CH", "IT"],
      availableLanguage: [
        { "@type": "Language", name: "German"  },
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
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: [
      { "@type": "Country", name: "Germany"     },
      { "@type": "Country", name: "Austria"     },
      { "@type": "Country", name: "Switzerland" },
      { "@type": "Country", name: "Italy"       },
    ],
  },

  // Service schema with proper Offer types and explicit hosting price
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
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "3D Websites / 3D Websites / Siti Web 3D",
            description: "Immersive 3D Web-Erlebnisse mit Three.js & WebGL · Immersive 3D web experiences with Three.js & WebGL · Esperienze web 3D immersive con Three.js e WebGL",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Webdesign / Web Design / Web Design",
            description: "Professionelles Webdesign auf Maß mit React & Next.js · Professional custom web design with React & Next.js · Web design professionale su misura con React e Next.js",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Webentwicklung / Web Development / Sviluppo Web",
            description: "Schnelle, skalierbare Webanwendungen · Fast, scalable web applications · Applicazioni web veloci e scalabili",
          },
        },
        {
          // Hosting: explicit fixed price so Google can show price snippets
          "@type": "Offer",
          name: "Managed Website Hosting ab €20/Monat",
          price: "20.00",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: 20,
            priceCurrency: "EUR",
            unitText: "MONTH",
          },
          itemOffered: {
            "@type": "Service",
            name: "Managed Hosting / Managed Hosting / Hosting gestito",
            description: "Verwaltetes Hosting ab €20/mo – Fixpreis. Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python, Go, Docker, Svelte, Astro & statische Websites · Managed hosting from €20/mo fixed price. Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python, Go, Docker, Svelte, Astro & static sites · Hosting gestito da €20/mese prezzo fisso. Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python, Go, Docker, Svelte, Astro e siti statici",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "WordPress / WordPress / WordPress",
            description: "WordPress-Websites und WooCommerce-Shops · WordPress websites and WooCommerce shops · Siti WordPress e negozi WooCommerce",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "E-Commerce / E-Commerce / E-Commerce",
            description: "Online-Shops optimiert für Conversions · Conversion-optimised online shops · Negozi online ottimizzati per le conversioni",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "App-Entwicklung / App Development / Sviluppo App",
            description: "Cross-platform Apps mit React Native & Flutter für iOS & Android · Cross-platform apps with React Native & Flutter for iOS & Android · App cross-platform con React Native e Flutter per iOS e Android",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "SEO / SEO / SEO",
            description: "Technisches SEO & Sichtbarkeit in Google und AI-Suchmaschinen · Technical SEO & visibility in Google and AI search engines · SEO tecnico e visibilità su Google e motori di ricerca AI",
          },
        },
      ],
    },
  },
}

// ─── Standalone Hosting Service Schema ───────────────────────────────────
// Used on contact & home pages; enables Google price snippets for hosting queries.
export const hostingSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Managed Website Hosting – pokyh.studio",
  alternateName: [
    "Verwaltetes Website-Hosting",
    "Managed Web Hosting Südtirol",
    "Hosting gestito per siti web",
    "Managed Website Hosting South Tyrol",
  ],
  description:
    "Vollständig verwaltetes Website-Hosting ab €20/Monat – Fixpreis. Node.js, Next.js, React, Vue.js, WordPress, PHP/Laravel, Python, Go, Docker, Svelte, Astro & statische Websites. Inkl. SSL, Uptime-Monitoring & Setup. Powered by Dokploy.",
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.social.email,
  },
  areaServed: ["DE", "AT", "CH", "IT"],
  serviceType: "Web Hosting",
  url: `${siteConfig.url}/contact`,
  offers: {
    "@type": "Offer",
    name: "Managed Hosting Paket",
    price: "20.00",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    priceValidUntil: "2027-12-31",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: 20,
      priceCurrency: "EUR",
      unitText: "MONTH",
      billingDuration: "P1M",
    },
    url: `${siteConfig.url}/contact`,
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

// ─── FAQPage schema ───────────────────────────────────────────────────────
// Injected on /contact. FAQ rich results appear directly in Google SERPs.
// Questions target the most common search queries about our services.
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Was kostet eine Website bei pokyh.studio? / How much does a website cost? / Quanto costa un sito web?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hosting kostet fix €20/Monat. Die Entwicklungskosten hängen vom Umfang ab — nach deiner Anfrage erhältst du innerhalb 24h ein individuelles Angebot. Buchst du Website + Hosting zusammen, bekommst du 5% Rabatt auf die Entwicklungskosten. / Hosting costs a fixed €20/month. Development pricing depends on scope — you receive a custom quote within 24h. When you book Website + Hosting together, you get 5% off development costs. / L'hosting costa €20/mese fisso. I costi di sviluppo dipendono dall'ambito — ricevi un preventivo personalizzato entro 24h. Con Sito + Hosting insieme hai il 5% di sconto sullo sviluppo.",
      },
    },
    {
      "@type": "Question",
      name: "Wie lange dauert es, eine Website zu erstellen? / How long does it take to build a website? / Quanto tempo ci vuole per creare un sito web?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Eine einfache Website ist in 1–2 Wochen fertig. Ein individuelles Projekt mit 3D, Backend oder E-Commerce dauert 2–6 Wochen. Nach deiner Anfrage bekommst du innerhalb von 24h eine Einschätzung. / A simple website takes 1–2 weeks. A custom project with 3D, backend or e-commerce takes 2–6 weeks. After your inquiry you get an estimate within 24h. / Un sito semplice richiede 1–2 settimane. Un progetto personalizzato con 3D, backend o e-commerce richiede 2–6 settimane. Dopo la tua richiesta ricevi una stima entro 24h.",
      },
    },
    {
      "@type": "Question",
      name: "Welche Dienstleistungen bietet pokyh.studio an? / What services does pokyh.studio offer? / Quali servizi offre pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir bieten: 3D Websites mit Three.js, professionelles Webdesign, Frontend & Backend Entwicklung (React, Next.js, Node.js), SEO, Managed Hosting ab €20/mo, WordPress, WooCommerce, E-Commerce und App-Entwicklung (React Native, Flutter). / We offer: 3D websites with Three.js, professional web design, frontend & backend development (React, Next.js, Node.js), SEO, managed hosting from €20/mo, WordPress, WooCommerce, e-commerce and app development (React Native, Flutter). / Offriamo: siti web 3D con Three.js, web design professionale, sviluppo frontend & backend (React, Next.js, Node.js), SEO, hosting gestito da €20/mese, WordPress, WooCommerce, e-commerce e sviluppo app (React Native, Flutter).",
      },
    },
    {
      "@type": "Question",
      name: "Welche Technologien verwendet pokyh.studio? / Which technologies does pokyh.studio use? / Quali tecnologie usa pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir entwickeln mit Next.js, React, Three.js, TypeScript, Node.js, Python und Go. Für Content-Management nutzen wir WordPress. Apps entwickeln wir mit React Native und Flutter. Für Hosting setzen wir auf Dokploy – eine moderne Deployment-Plattform. / We develop with Next.js, React, Three.js, TypeScript, Node.js, Python and Go. For content management we use WordPress. We build apps with React Native and Flutter. For hosting we use Dokploy, a modern deployment platform. / Sviluppiamo con Next.js, React, Three.js, TypeScript, Node.js, Python e Go. Per la gestione contenuti usiamo WordPress. App con React Native e Flutter. Per l'hosting usiamo Dokploy.",
      },
    },
    {
      "@type": "Question",
      name: "Bietet pokyh.studio auch Hosting an? / Does pokyh.studio offer hosting? / pokyh.studio offre anche hosting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja — verwaltetes Hosting ab €20/Monat, Fixpreis. Powered by Dokploy. Wir hosten Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python/Django, Go, Docker, Svelte, Astro und statische Websites. Inklusive SSL, Uptime-Monitoring, Setup und Custom Domain. / Yes — managed hosting from €20/month, fixed price. Powered by Dokploy. We host Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python/Django, Go, Docker, Svelte, Astro and static sites. Includes SSL, uptime monitoring, setup and custom domain. / Sì — hosting gestito da €20/mese, prezzo fisso. Hosted con Dokploy. Ospitiamo Node.js, Next.js, React, Vue.js, Nuxt, Angular, WordPress, PHP/Laravel, Python/Django, Go, Docker, Svelte, Astro e siti statici. Include SSL, monitoraggio uptime, setup e dominio personalizzato.",
      },
    },
    {
      "@type": "Question",
      name: "Kann ich meine WordPress-Website selbst bearbeiten? / Can I edit my WordPress website myself? / Posso modificare il mio sito WordPress da solo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. WordPress-Websites sind so aufgebaut, dass du Inhalte, Bilder und Texte selbst bearbeiten kannst — ohne Programmierkenntnisse. Wir richten alles ein und geben dir eine Einführung. / Yes. WordPress websites are built so you can edit content, images and text yourself — no coding knowledge needed. We set everything up and give you an introduction. / Sì. I siti WordPress sono costruiti in modo che tu possa modificare contenuti, immagini e testi da solo — senza conoscenze di programmazione. Configuriamo tutto e ti facciamo un'introduzione.",
      },
    },
    {
      "@type": "Question",
      name: "Bietet pokyh.studio auch App-Entwicklung an? / Does pokyh.studio offer app development? / pokyh.studio offre sviluppo di app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Wir entwickeln Cross-Platform Apps für iOS und Android mit React Native und Flutter — eine Codebase, beide Plattformen. Schreib uns und beschreib dein Projekt. / Yes. We develop cross-platform apps for iOS and Android with React Native and Flutter — one codebase, both platforms. Write to us and describe your project. / Sì. Sviluppiamo app cross-platform per iOS e Android con React Native e Flutter — una codebase, entrambe le piattaforme. Scrivici e descrivi il tuo progetto.",
      },
    },
    {
      "@type": "Question",
      name: "In welchen Sprachen arbeitet pokyh.studio? / What languages does pokyh.studio work in? / In quali lingue lavora pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir arbeiten auf Deutsch, Englisch und Italienisch und sind ein Digital Studio aus Südtirol / Alto Adige. / We work in German, English and Italian and are a digital studio from South Tyrol / Alto Adige. / Lavoriamo in tedesco, inglese e italiano e siamo uno studio digitale dell'Alto Adige / Südtirol.",
      },
    },
    {
      "@type": "Question",
      name: "Wie schnell ist eine Website von pokyh.studio? / How fast is a website by pokyh.studio? / Quanto è veloce un sito web di pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir bauen mit Next.js und React nach Core Web Vitals-Standards. Websites erzielen typischerweise 90+ Punkte auf Google PageSpeed. Bilder werden optimiert, Assets gecacht und Code gesplittet. / We build with Next.js and React to Core Web Vitals standards. Websites typically score 90+ on Google PageSpeed. Images are optimised, assets cached and code split. / Costruiamo con Next.js e React secondo gli standard Core Web Vitals. I siti ottengono tipicamente 90+ punti su Google PageSpeed. Immagini ottimizzate, asset in cache e code splitting.",
      },
    },
    {
      "@type": "Question",
      name: "Wo ist pokyh.studio ansässig? / Where is pokyh.studio located? / Dove si trova pokyh.studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wir sind in Südtirol / Alto Adige, Italien ansässig und betreuen Kunden in ganz Deutschland, Österreich, der Schweiz und Italien. Beratung und Kommunikation auf Deutsch, Englisch und Italienisch. / We are based in South Tyrol / Alto Adige, Italy and serve clients throughout the DACH region and Italy. Consulting in German, English and Italian. / Siamo con sede in Alto Adige / Südtirol, Italia, e serviamo clienti in tutta la regione DACH e in Italia. Consulenza in tedesco, inglese e italiano.",
      },
    },
  ],
}
