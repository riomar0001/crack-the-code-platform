import type { MetadataRoute } from "next";

import { absoluteUrl, CONTENT_LAST_MODIFIED } from "@/lib/seo";

/**
 * Every public, indexable page. A fixed `lastModified` is deliberate: stamping
 * "now" on every request would tell crawlers everything changes constantly.
 * Bump CONTENT_LAST_MODIFIED in lib/seo.ts when the pages really change.
 */
const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/register", priority: 0.9, changeFrequency: "weekly" },
  { path: "/rules", priority: 0.7, changeFrequency: "monthly" },
  { path: "/conduct", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_LAST_MODIFIED,
    changeFrequency,
    priority,
  }));
}
