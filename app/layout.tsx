import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.fullName} · CTF Competition`,
    template: `%s · ${site.fullName}`,
  },
  description: site.tagline,
  applicationName: site.fullName,
  openGraph: {
    title: `${site.fullName} · CTF Competition`,
    description: site.tagline,
    siteName: site.fullName,
    type: "website",
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
        {/* Scroll reveals are opt-out, not opt-in: without JS, show everything. */}
        <noscript>
          <style>{
            `[data-reveal][data-revealed="false"]{opacity:1!important;filter:none!important;transform:none!important}`
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
