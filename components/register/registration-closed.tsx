import Link from "next/link";

import { registrationClosesLabel } from "@/lib/registration/window";
import { eventDateLabel, site } from "@/lib/site";

/** Shown in place of the registration forms once the deadline has passed. */
export function RegistrationClosed() {
  return (
    <div className="ctc-register-grid">
      <div className="ctc-done ctc-notch-28">
        <div className="ctc-stripe-layer" aria-hidden />

        <div className="ctc-done-eyebrow">REGISTRATION CLOSED</div>
        <div className="ctc-done-title">Enlistment is closed</div>

        <p>
          Registration for {site.fullName} closed
          {registrationClosesLabel ? ` on ${registrationClosesLabel}` : ""}.
          {eventDateLabel ? ` The operation begins on ${eventDateLabel}.` : ""} Already registered?
          Your squad is on the roster, and your confirmation email has your team code.
        </p>

        <div className="ctc-done-actions">
          <Link href="/" className="ctc-btn ctc-btn--primary ctc-btn--md ctc-slant-12">
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
