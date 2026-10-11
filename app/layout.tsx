import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fontVariables } from "@/lib/fonts";
import { defaultTitle, getSiteUrl, seoDescription, socialImage } from "@/lib/seo";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  // Makes every relative URL below (canonicals, share images) absolute.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s · ${site.fullName}`,
  },
  description: seoDescription,
  applicationName: site.fullName,
  authors: [{ name: site.byline }],
  creator: site.byline,
  keywords: [
    "Crack The Code",
    "CTF",
    "capture the flag",
    "University of Mindanao",
    "College of Computing Education",
    "cybersecurity competition",
    "Davao City",
  ],
  // Pages set their own canonical (see lib/seo.ts); one here would point every
  // page at the home page.
  openGraph: {
    title: defaultTitle,
    description: seoDescription,
    siteName: site.fullName,
    type: "website",
    locale: "en_PH",
    url: "/",
    images: [socialImage()],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: seoDescription,
    images: [socialImage()],
  },
  // Indexing is the default, so no blanket `index, follow` (it would also sit
  // beside the `noindex` Next adds to the 404 page). This only asks Google for
  // large image previews and full-length snippets.
  robots: {
    googleBot: { "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#128AFA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior tells Next the smooth scroll in globals.css is
    // intentional, so it does not warn and does not fight route transitions.
    <html lang="en" className={fontVariables} data-scroll-behavior="smooth">
      <head>
        {/* Scroll reveals are opt-out, not opt-in: without JS, show everything.
            Likewise the collapsed mobile menu cannot open, so lay the nav out. */}
        <noscript>
          <style>{
            `[data-reveal][data-revealed="false"]{opacity:1!important;filter:none!important;transform:none!important}` +
            `.ctc-nav-toggle{display:none!important}` +
            `.ctc-header-inner{flex-wrap:wrap!important}` +
            `.ctc-nav{position:static!important;visibility:visible!important;opacity:1!important;transform:none!important;pointer-events:auto!important;flex:1 0 100%!important;flex-direction:row!important;flex-wrap:wrap!important;padding:0!important;box-shadow:none!important;border:0!important}`
          }</style>
        </noscript>
      </head>
      <body>
        <div className="ctc-shell">
          <SiteHeader />
          <main className="ctc-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
