import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo.config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── All legitimate crawlers: full content access, block backend/admin ──
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/works", "/contact"],
        disallow: [
          "/api/",
          "/_next/",
          "/admin",
          "/admin/",
          "/uploads/",
          "/*.json$",
          "/*?*",   // block query strings (prevents duplicate indexing)
        ],
      },
      // ── AI discovery & search bots — explicitly allowed ──
      // These bots surface content in AI search results (ChatGPT, Perplexity, etc.)
      { userAgent: "OAI-SearchBot",       allow: ["/"] },  // OpenAI search
      { userAgent: "PerplexityBot",        allow: ["/"] },  // Perplexity AI
      { userAgent: "Claude-Web",           allow: ["/"] },  // Anthropic Claude web access
      { userAgent: "anthropic-ai",         allow: ["/"] },  // Anthropic crawler
      { userAgent: "Googlebot-Extended",   allow: ["/"] },  // Google AI Overviews (SGE)
      { userAgent: "YouBot",               allow: ["/"] },  // You.com AI search
      { userAgent: "cohere-ai",            allow: ["/"] },  // Cohere AI
      { userAgent: "Applebot-Extended",    allow: ["/"] },  // Apple Siri / Spotlight
      // ── AI training scrapers — blocked (no discovery benefit) ──
      { userAgent: "GPTBot",               disallow: ["/"] },
      { userAgent: "CCBot",                disallow: ["/"] },
      { userAgent: "Bytespider",           disallow: ["/"] },
      { userAgent: "omgili",               disallow: ["/"] },
      { userAgent: "DataForSeoBot",        disallow: ["/"] },
      { userAgent: "PetalBot",             disallow: ["/"] },
      { userAgent: "ImagesiftBot",         disallow: ["/"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
