import Link from "next/link";

import { CreditGroups } from "@/components/layout/credit-groups";
import { Reveal } from "@/components/ui/reveal";
import { footerNav, organizers, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="ctc-footer">
      <div className="ctc-footer-top">
        <div className="ctc-footer-brand">
          <span className="ctc-footer-brand-name">{site.name.toUpperCase()}</span>
          <span className="ctc-footer-brand-sub">{site.suffix.toUpperCase()}</span>
        </div>

        <nav className="ctc-footer-links" aria-label="Footer">
          {footerNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="ctc-footer-bottom">
        <div className="ctc-footer-bottom-inner">
          <Reveal>
            <CreditGroups tone="dark" />
          </Reveal>

          <div className="ctc-footer-legal">
            <div>
              © {site.copyrightYear} {site.fullName} · {organizers[0]}
            </div>
            <div>
              by <b>{site.byline}</b>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
