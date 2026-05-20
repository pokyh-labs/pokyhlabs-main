import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo.config"

export default function sitemap(): MetadataRoute.Sitemap {
  return siteConfig.pages.map(({ path, priority, changeFreq }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq,
    priority,
  }))
}
