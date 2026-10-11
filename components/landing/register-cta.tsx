"use client";

import Link from "next/link";

import { useRegistrationOpen } from "@/lib/registration/use-registration-open";

/** The hero's main button: "register" while open, a muted notice once closed. */
export function RegisterCta() {
  const open = useRegistrationOpen();

  if (!open) {
    return (
      <span className="ctc-btn ctc-btn--closed ctc-btn--lg ctc-slant-14" role="status">
        REGISTRATION CLOSED
      </span>
    );
  }

  return (
    <Link href="/register" className="ctc-btn ctc-btn--primary ctc-btn--lg ctc-slant-14">
      REGISTER TEAM <span style={{ fontSize: 16 }}>▶</span>
    </Link>
  );
}
