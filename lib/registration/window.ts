import { site } from "@/lib/site";

/**
 * When registration closes. One source of truth for the server actions (which
 * enforce it) and the interface (which reflects it).
 */

const closesMs = new Date(site.registrationCloses).getTime();

/** `null` when the configured value is unusable: registration then stays open. */
export const registrationClosesAt: number | null = Number.isNaN(closesMs) ? null : closesMs;

export const isRegistrationOpen = (now: number = Date.now()): boolean =>
  registrationClosesAt === null || now < registrationClosesAt;

/** The last day registration is open, e.g. "October 29, 2026". */
export const registrationClosesLabel: string =
  registrationClosesAt === null
    ? ""
    : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "Asia/Manila" }).format(
        registrationClosesAt,
      );

export const REGISTRATION_CLOSED_MESSAGE = registrationClosesLabel
  ? `Registration closed on ${registrationClosesLabel}.`
  : "Registration is closed.";
