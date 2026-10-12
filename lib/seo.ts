import type { Metadata } from "next";

import { credits, site } from "@/lib/site";

/**
 * Everything search engines and link previews read, in one place.
 */

/** The live site. Used when no SITE_URL is configured. */
const PRODUCTION_URL = "https://www.cce-crackthecode.dev";

/**
 * Absolute base URL of the site, with no trailing slash. Never taken from the
 * request's Host header, which an attacker controls. Set SITE_URL to override
 * (for a staging domain, say).
 */
export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return (explicit || PRODUCTION_URL).replace(/\/+$/, "");
}

export const absoluteUrl = (path: string) => `${getSiteUrl()}${path === "/" ? "" : path}`;

/**
 * One sentence, ~150 characters: search results cut off around 155. It states
 * what the event is and when, and avoids anything that goes stale (such as the
 * registration deadline).
 */
export const seoDescription = `${site.fullName} is a capture-the-flag competition for College of Computing Education students at the University of Mindanao, held October 30, 2026.`;

/** Who may take part, in the words used for search-engine data. */
const AUDIENCE = "University of Mindanao students of the College of Computing Education";
const ELIGIBILITY = `Open only to ${AUDIENCE}.`;

export const defaultTitle = `${site.fullName} · CTF Competition`;

/**
 * The share image, in /public. An explicit absolute URL (rather than Next's
 * `opengraph-image` file convention) so it is the same in every environment
 * and on every page: a page that sets its own `openGraph` would otherwise drop
 * an inherited image, and the file convention resolved to localhost in dev.
 * To change the picture, save a new file under a new name (crawlers cache by
 * URL) and update the path here.
 */
const SOCIAL_IMAGE_PATH = "/social-preview.png";

const SOCIAL_IMAGE_ALT = `${site.fullName}: ${site.season} capture-the-flag competition on October 30, 2026, by the University of Mindanao College of Computing Education.`;

export const socialImage = () => ({
  url: absoluteUrl(SOCIAL_IMAGE_PATH),
  width: 1200,
  height: 630,
  alt: SOCIAL_IMAGE_ALT,
});

/** Bump when the content of the public pages meaningfully changes. */
export const CONTENT_LAST_MODIFIED = "2026-10-11";

const OPEN_GRAPH_BASE = {
  siteName: site.fullName,
  type: "website",
  locale: "en_PH",
} as const;

type PageMetadataInput = {
  /** Omit for the home page, which uses the full default title. */
  title?: string;
  description: string;
  /** The page's path, e.g. "/rules". Becomes the canonical URL. */
  path: string;
};

/**
 * Title, description, canonical URL and social tags for one page.
 *
 * A page that sets `openGraph` replaces the layout's whole `openGraph` object,
 * so each page has to carry the full set; building it here keeps them in step
 * and means a new page cannot forget its canonical or its share title.
 */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const shareTitle = title ? `${title} · ${site.fullName}` : defaultTitle;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      title: shareTitle,
      description,
      url: path,
      images: [socialImage()],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [socialImage()],
    },
  };
}

/* -------------------------------------------------------------------------
   Structured data
   ------------------------------------------------------------------------- */

/**
 * schema.org Event + WebSite, for rich results. Dates come from site.ts so
 * they cannot drift from the countdown. `registrationOpen` is passed in (and
 * the caller reads the clock per request) so availability flips to sold out
 * after the deadline without a redeploy.
 */
export function homeJsonLd({ registrationOpen }: { registrationOpen: boolean }) {
  const url = getSiteUrl();
  // Google wants a URL for every organizer. One without a site of its own
  // (a student team) points at this site, which it runs.
  const organizers = credits[0].entries.map((entry) => ({
    "@type": "Organization",
    name: entry.name,
    url: entry.url ?? url,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: site.fullName,
        description: seoDescription,
        inLanguage: "en",
      },
      {
        "@type": "Event",
        "@id": `${url}/#event`,
        name: site.fullName,
        description: `${site.tagline} ${ELIGIBILITY}`,
        url,
        image: [socialImage().url],
        startDate: site.eventStart,
        endDate: site.eventEnd,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        inLanguage: "en",
        location: {
          "@type": "Place",
          name: "University of Mindanao",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Bolton St.",
            addressLocality: "Davao City",
            addressCountry: "PH",
          },
        },
        organizer: organizers,
        isAccessibleForFree: true,
        audience: { "@type": "Audience", audienceType: AUDIENCE },
        // Entry is free; the offer is the registration, open until it closes.
        offers: {
          "@type": "Offer",
          url: absoluteUrl("/register"),
          price: "0",
          priceCurrency: "PHP",
          availability: registrationOpen
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
          validThrough: site.registrationCloses,
        },
      },
    ],
  };
}
