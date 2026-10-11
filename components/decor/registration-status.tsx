"use client";

import { useRegistrationOpen } from "@/lib/registration/use-registration-open";

/** The ticker's first item, which follows the registration deadline. */
export function RegistrationStatus() {
  return useRegistrationOpen() ? "REGISTRATION OPEN" : "REGISTRATION CLOSED";
}
