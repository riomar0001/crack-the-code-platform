import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FaqBackdrop } from "@/components/decor/faq-backdrop";
import { MissionBackdrop } from "@/components/decor/mission-backdrop";
import { Ticker } from "@/components/decor/ticker";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { Hero } from "@/components/landing/hero";
import { MissionSelect } from "@/components/landing/mission-select";
import { IntroCurtain } from "@/components/layout/intro-curtain";
import { HomeJsonLd } from "@/components/seo/home-json-ld";
import { Reveal } from "@/components/ui/reveal";
import { faqs } from "@/lib/content/faqs";
import { missions } from "@/lib/content/missions";
import { pageMetadata, seoDescription } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ description: seoDescription, path: "/" });

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeJsonLd />
      </Suspense>
      <IntroCurtain />

      <Hero />
      <Ticker />

      <section id="missions" className="ctc-section ctc-missions">
        <MissionBackdrop />

        <Reveal className="ctc-section-head">
          <div className="ctc-eyebrow">MISSION SELECT</div>
          <h2>Choose your field</h2>
        </Reveal>

        <MissionSelect missions={missions} />
      </section>

      <section id="faq" className="ctc-section ctc-faq">
        <FaqBackdrop />

        <Reveal direction="left" className="ctc-faq-intro">
          <div className="ctc-eyebrow">FAQ</div>
          <h2>Before you enlist</h2>
          <p>
            Read the <Link href="/rules">Rules</Link> for the full details.
          </p>
        </Reveal>

        <FaqAccordion faqs={faqs} />
      </section>
    </>
  );
}
