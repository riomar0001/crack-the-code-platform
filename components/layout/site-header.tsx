"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { markIntroSeen } from "@/components/layout/intro-state";
import { useRegistrationOpen } from "@/lib/registration/use-registration-open";
import { mainNav } from "@/lib/site";

const NAV_ID = "ctc-site-nav";

/**
 * Sticky header. Client-side so the current route can be marked with
 * `aria-current` and so the nav can collapse into a menu on narrow screens;
 * the in-page anchors (`/#missions`) never count as current.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const registrationOpen = useRegistrationOpen();

  // The menu is open only for the route it was opened on, so navigating
  // anywhere closes it without needing an effect to reset state.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const close = () => setOpenOn(null);

  useEffect(() => {
    // Landing deep on another page counts as having "arrived" — the intro
    // curtain should not play later when the visitor heads to the home page.
    if (pathname !== "/") markIntroSeen();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isCurrent = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <header className="ctc-header">
      <div className="ctc-header-inner">
        <BrandMark />

        <nav id={NAV_ID} className="ctc-nav" aria-label="Main" data-open={open}>
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              onClick={close}
            >
              {item.label}
            </Link>
          ))}

          {/* Phones have no room for the header button, so it lives here. */}
          {registrationOpen && (
            <Link
              href="/register"
              className="ctc-btn ctc-btn--primary ctc-btn--sm ctc-slant-10 ctc-nav-cta"
              onClick={close}
            >
              REGISTER
            </Link>
          )}
        </nav>

        <div className="ctc-header-actions">
          {registrationOpen && (
            <Link href="/register" className="ctc-btn ctc-btn--primary ctc-btn--sm ctc-slant-10">
              REGISTER
            </Link>
          )}

          <button
            type="button"
            className="ctc-nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={NAV_ID}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <span className="ctc-nav-toggle-bars" aria-hidden />
          </button>
        </div>
      </div>

      {/* Tap-away layer for the open menu; the nav sits above it. */}
      {open && <div className="ctc-nav-scrim" onClick={close} aria-hidden />}
    </header>
  );
}
