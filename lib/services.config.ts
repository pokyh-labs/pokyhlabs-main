export interface Service {
  id: string
  name: string
  pitch: string
  detail: string
  price?: string
  badge?: string
}

export const services: Service[] = [
  {
    id: "frontend",
    name: "Frontend",
    pitch: "Custom websites & apps — pixel-perfect, blazing fast.",
    detail:
      "Built with React & Next.js. Every interaction is smooth, every page loads in under a second. Same stack as Netflix and Airbnb.",
  },
  {
    id: "backend",
    name: "Backend",
    pitch: "APIs, databases & logic that scales.",
    detail:
      "Login systems, databases, custom APIs. We build the invisible engine that powers your product — secure, fast, ready to grow.",
  },
  {
    id: "threejs",
    name: "3D & Three.js",
    pitch: "Immersive 3D experiences that people remember.",
    detail:
      "Interactive 3D directly in the browser — no app needed. Your website becomes an experience visitors share and return to.",
    badge: "Signature",
  },
  {
    id: "seo",
    name: "SEO",
    pitch: "Rank on Google. Get found. Grow revenue.",
    detail:
      "SEO = Suchmaschinenoptimierung. When someone searches your service on Google, you appear on page 1. More visibility → more customers → more revenue.",
  },
  {
    id: "hosting",
    name: "Hosting",
    pitch: "Always online. Managed by us. Zero headaches.",
    detail:
      "Deployment, SSL certificates, daily backups, uptime monitoring — all handled. Your site is fast, secure, and live 24/7.",
    price: "€20 / mo",
    badge: "Fixed price",
  },
  {
    id: "wordpress",
    name: "WordPress",
    pitch: "A website you can update yourself.",
    detail:
      "Custom design on WordPress — the CMS powering 43% of the web. Edit content yourself anytime, no technical knowledge needed.",
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    pitch: "An online shop built to convert.",
    detail:
      "Optimized product pages, frictionless checkout, payment integration. Whether 10 products or 10,000 — built to sell.",
  },
  {
    id: "react-native",
    name: "React Native",
    pitch: "iOS & Android apps — one codebase, native feel.",
    detail:
      "We build cross-platform mobile apps with React Native. Shared logic between web and mobile, deployed to the App Store and Google Play.",
  },
  {
    id: "flutter",
    name: "Flutter",
    pitch: "Beautiful native apps for every platform.",
    detail:
      "Google's Flutter framework lets us build fast, expressive apps for iOS, Android, web, and desktop — from a single codebase.",
  },
]

export const budgets = [
  { id: "sub2k", label: "< €2,000", note: "Landing page / small site" },
  { id: "2k5k", label: "€2,000 – €5,000", note: "Standard website" },
  { id: "5k15k", label: "€5,000 – €15,000", note: "Complex app / shop" },
  { id: "15kplus", label: "> €15,000", note: "Enterprise / long-term" },
  { id: "unsure", label: "Not sure yet", note: "Let's figure it out" },
]

export const timelines = [
  { id: "asap", label: "ASAP", note: "Within 2 weeks" },
  { id: "1to3", label: "1 – 3 months", note: "Standard" },
  { id: "3to6", label: "3 – 6 months", note: "Larger project" },
  { id: "flexible", label: "Flexible", note: "No rush" },
]
