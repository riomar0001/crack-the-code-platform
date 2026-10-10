import type { Metadata } from "next";

import { SkyLayer } from "@/components/decor/sky-layer";
import { RegisterForm } from "@/components/register/register-form";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team Registration",
  description: `Register your squad of ${site.minMembers}–${site.maxMembers} for ${site.fullName}. Open to all College of Computing Education students.`,
};

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
            your team name and all members before the announced deadline. The captain registers the
            team and receives a team code to share with the squad.
          </p>
        </div>

        <RegisterForm />
      </div>
    </section>
  );
}
