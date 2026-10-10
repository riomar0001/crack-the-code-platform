import Link from "next/link";

import { SkyLayer } from "@/components/decor/sky-layer";
import { Countdown } from "@/components/landing/countdown";
import { OperatorTablet } from "@/components/landing/operator-tablet";
import { CreditGroups } from "@/components/layout/credit-groups";
import { Halo } from "@/components/ui/halo";
import { Reveal } from "@/components/ui/reveal";
import { eventDateLabel, site } from "@/lib/site";

export function Hero() {
  return (
    <section className="ctc-sky-section">
      <SkyLayer />

      <div className="ctc-hero">
        <div className="ctc-hero-copy">
          <Reveal direction="left" className="ctc-hero-chips">
            <div className="ctc-chip ctc-chip--solid ctc-slant-8">
              {site.season}
            </div>
            {eventDateLabel && (
              <div className="ctc-chip ctc-chip--light ctc-slant-8">
                <time dateTime={site.eventStart}>{eventDateLabel.toUpperCase()}</time>
              </div>
            )}
          </Reveal>

          <Reveal as="h1" delay={100} className="ctc-hero-title">
            <span>CRACK</span>
            <span>THE CODE </span>
            <span className="ctc-hero-title-tag">
              {site.suffix.toUpperCase()}
            </span>
          </Reveal>

          <Reveal as="p" delay={220} className="ctc-hero-lede">
            {site.tagline}
          </Reveal>

          <Reveal delay={320}>
            <Countdown target={site.eventStart} />
          </Reveal>

          <Reveal delay={420} className="ctc-hero-actions">
            <Link
              href="/register"
              className="ctc-btn ctc-btn--primary ctc-btn--lg ctc-slant-14"
            >
              REGISTER TEAM <span style={{ fontSize: 16 }}>▶</span>
            </Link>
            <Link
              href="/#faq"
              className="ctc-btn ctc-btn--ghost ctc-btn--lg ctc-slant-14"
            >
              BRIEFING
            </Link>
          </Reveal>

          <Reveal delay={520} className="ctc-hero-credits">
            <CreditGroups tone="light" />
          </Reveal>
        </div>

        <div className="ctc-hero-visual">
          <div className="ctc-hero-halo" aria-hidden>
            <Halo size={560} speed={40} strokeWidth={1.2} inner />
          </div>

          <Reveal
            direction="scale"
            delay={250}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <OperatorTablet />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
