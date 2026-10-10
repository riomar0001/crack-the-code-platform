import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { footerNav, site } from "@/lib/site";

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
          <div className="ctc-footer-eyebrow">ORGANIZED BY</div>

          <Reveal className="ctc-footer-orgs">
            {site.organizers.map((organizer) => (
              <div key={organizer}>{organizer}</div>
            ))}
          </Reveal>

          <div className="ctc-footer-legal">
            <div>
              © {site.copyrightYear} {site.fullName} · {site.organizers[0]}
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
