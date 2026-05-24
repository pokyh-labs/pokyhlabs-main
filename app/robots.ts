import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo.config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // All legitimate crawlers: full access (no admin/API/uploads)
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin",
          "/admin/",
          "/uploads/",
        ],
      },
      // AI discovery & search bots — explicitly allowed so users find us on ChatGPT, Perplexity, Claude etc.
      { userAgent: "OAI-SearchBot", allow: "/" },    // OpenAI search (ChatGPT search results)
      { userAgent: "PerplexityBot", allow: "/" },     // Perplexity AI search
      { userAgent: "Claude-Web", allow: "/" },        // Anthropic Claude real-time web access
      { userAgent: "anthropic-ai", allow: "/" },      // Anthropic general crawler
      { userAgent: "Googlebot-Extended", allow: "/" },// Google AI Overviews (SGE)
      // AI training scrapers — blocked (no discovery benefit, just trains models)
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "Bytespider", disallow: ["/"] },
      { userAgent: "omgili", disallow: ["/"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
