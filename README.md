# pokyh.studio

Digital Studio aus Südtirol. We build fast, scalable, and immersive web experiences.

**Live:** [pokyh.studio](https://pokyh.studio)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, SSR) |
| UI | React 19, TypeScript |
| Animation | GSAP + ScrollTrigger |
| Fonts | Instrument Serif, DM Mono (Google Fonts) |
| Styling | CSS Variables + inline styles |
| SEO | Next.js Metadata API, JSON-LD, Sitemap, robots.txt |

---

## Getting Started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run start     # serve production build
```

---

## SEO Configuration

All SEO settings live in **one file**: [`lib/seo.config.ts`](./lib/seo.config.ts)

### Add or change keywords

```ts
// lib/seo.config.ts
keywords: [
  "website kaufen",
  "3d website kaufen",
  // add your keyword here
],
```

### Update title / description

```ts
title: {
  default: "Your new title here",
  template: "%s | pokyh.studio",
},
description: "Your new meta description...",
```

### Add a new page to the sitemap

```ts
pages: [
  { path: "/", priority: 1.0, changeFreq: "weekly" },
  { path: "/about", priority: 0.8, changeFreq: "monthly" }, // ← add here
],
```

The page is instantly included in `/sitemap.xml` — no other changes needed.

### Add a new JSON-LD schema

Add a new property to the `structuredData` object in `lib/seo.config.ts`, then inject it in [`app/layout.tsx`](./app/layout.tsx):

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.yourNewSchema) }}
/>
```

### Connect Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property → Domain → `pokyh.studio`
3. Copy the HTML tag verification token (the value of `content="..."`)
4. Paste it in `lib/seo.config.ts`:
   ```ts
   verification: {
     google: "your-token-here",
   },
   ```
5. Deploy and verify
6. Submit the sitemap: `https://pokyh.studio/sitemap.xml`

---

## Project Structure

```
app/
  layout.tsx            # Root layout — metadata + JSON-LD injection
  page.tsx              # Home page
  sitemap.ts            # /sitemap.xml (auto-generated from seo.config)
  robots.ts             # /robots.txt
  opengraph-image.tsx   # Dynamic OG image 1200×630
  globals.css

components/
  HomeClientWrapper.tsx # GSAP scroll animations
  ParticleCanvas.tsx    # 3D interactive particle system
  Header.tsx
  Headline.tsx          # SSR-rendered H1 with character animation
  Socials.tsx
  RailLine.tsx
  ScrollIndicator.tsx

lib/
  seo.config.ts         # ← Single source of truth for all SEO
```

---

## Performance & SEO Checklist

- [x] SSR — H1 text rendered server-side (crawlable)
- [x] Metadata — title, description, keywords, canonical
- [x] Open Graph + Twitter Card
- [x] Dynamic OG image (1200×630)
- [x] JSON-LD structured data (Organization, WebSite, LocalBusiness, Service)
- [x] `/sitemap.xml` auto-generated
- [x] `/robots.txt` with sitemap pointer
- [x] Security headers (CSP-ready, X-Frame-Options, etc.)
- [x] Immutable cache headers for static assets
- [x] Font `display: swap` for faster LCP
- [x] Image formats: AVIF + WebP
- [ ] Google Search Console verified (add token to `seo.config.ts`)
- [ ] Bing Webmaster Tools verified (add token to `seo.config.ts`)
