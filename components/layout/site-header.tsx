"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { mainNav } from "@/lib/site";

/**
 * Sticky header. Client-side only so the current route can be marked with
 * `aria-current`; the in-page anchors (`/#missions`) never count as current.
 */
export function SiteHeader() {
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <header className="ctc-header">
      <div className="ctc-header-inner">
        <BrandMark />

        <nav className="ctc-nav" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ctc-header-actions">
          <Link href="/register" className="ctc-btn ctc-btn--primary ctc-btn--sm ctc-slant-10">
            REGISTER
          </Link>
        </div>
      </div>
    </header>
  );
}
