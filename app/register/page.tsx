import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { SkyLayer } from "@/components/decor/sky-layer";
import { RegisterForm } from "@/components/register/register-form";
import { RegistrationClosed } from "@/components/register/registration-closed";
import { RulesReadout } from "@/components/register/rules-readout";
import { Reveal } from "@/components/ui/reveal";
import { isRegistrationOpen, registrationClosesLabel } from "@/lib/registration/window";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Team Registration",
  description: `Register your squad of ${site.minMembers}–${site.maxMembers} for ${site.fullName}. Open only to University of Mindanao students from the College of Computing Education.`,
  path: "/register",
});

/**
 * Decides open vs closed per request. `connection()` keeps this out of the
 * prerender, so the answer reflects the clock at request time rather than the
 * moment the site was built.
 */
async function RegistrationGate() {
  await connection();

  return isRegistrationOpen() ? (
    <RegisterForm rules={<RulesReadout />} />
  ) : (
    <RegistrationClosed />
  );
}

export default function RegisterPage() {
  return (
    <section className="ctc-sky-section ctc-sky-section--short">
      <SkyLayer />

      <div className="ctc-register">
        <div>
          <div className="ctc-eyebrow">SQUAD ENLISTMENT</div>
          <Reveal as="h1" className="ctc-register-title">
            Team Registration
          </Reveal>
          <p className="ctc-register-lede">
            Open to all students currently enrolled in the College of Computing Education (CCE).
            Teams have {site.minMembers} to {site.maxMembers} members, all CCE students. Register
            your team name and all members before registration closes{registrationClosesLabel ? ` on ${registrationClosesLabel}` : ""}. The captain registers the
            team and receives a team code to share with the squad. Teammates then join with that code.
          </p>
        </div>

        <Suspense fallback={<div className="ctc-form-skeleton" aria-busy />}>
          <RegistrationGate />
        </Suspense>
      </div>
    </section>
  );
}
