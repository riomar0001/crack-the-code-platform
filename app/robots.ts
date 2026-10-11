import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

/**
 * Crawlers may index the public pages. The admin area and the APIs are kept
 * out: they hold nothing worth indexing and the admin page is `noindex` anyway.
 * (This file is a courtesy to well-behaved bots, not access control — the
 * admin area is protected by its own sign-in.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
