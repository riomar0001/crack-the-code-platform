import "server-only";

import type { MemberInput } from "@/lib/registration/schema";

import { sendMail } from "./mailer";
import {
  joinConfirmationEmail,
  registrationConfirmationEmail,
  type RosterEntry,
} from "./templates";

/**
 * Absolute base URL for links in emails.
 *
 * Deliberately not taken from the request's Host header: that is attacker
 * controlled, and an email carrying a link to someone else's domain is a
 * phishing vector. Set SITE_URL in production; on Vercel the production domain
 * is picked up automatically.
 */
function siteUrl(): string | null {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

function rulesUrl(): string | null {
  const base = siteUrl();
  return base ? `${base}/rules` : null;
}

const fullName = (member: MemberInput) => `${member.firstName} ${member.lastName}`;

/**
 * Tells every member of a newly enlisted squad that they are registered, with
 * the team code. One message addressed to the whole squad, so teammates see the
 * same email and can reply-all; they are on one roster and already know each
 * other.
 */
export async function sendRegistrationEmails(input: {
  teamName: string;
  teamCode: string;
  members: MemberInput[];
}): Promise<void> {
  const roster: RosterEntry[] = input.members.map((member, index) => ({
    alias: member.alias,
    detail: index === 0 ? `${fullName(member)} · Captain` : fullName(member),
  }));

  const email = registrationConfirmationEmail({
    teamName: input.teamName,
    teamCode: input.teamCode,
    roster,
    rulesUrl: rulesUrl(),
  });

  await sendMail({ to: input.members.map((member) => member.email), ...email });
}

/**
 * Confirms to a teammate that they joined a squad. `roster` is the aliases
 * from the database, captain first; only the joiner's own real name is known
 * here, so that is the only one shown.
 */
export async function sendJoinEmail(input: {
  teamName: string;
  teamCode: string;
  member: MemberInput;
  roster: string[];
}): Promise<void> {
  const mine = input.roster.findIndex(
    (alias) => alias.toLowerCase() === input.member.alias.toLowerCase(),
  );

  const roster: RosterEntry[] = input.roster.map((alias, index) => {
    const parts = [
      index === mine ? `${fullName(input.member)} · You` : null,
      index === 0 && index !== mine ? "Captain" : null,
    ].filter(Boolean);

    return { alias, detail: parts.join(" · ") || undefined };
  });

  const email = joinConfirmationEmail({
    alias: input.member.alias,
    teamName: input.teamName,
    teamCode: input.teamCode,
    roster,
    rulesUrl: rulesUrl(),
  });

  await sendMail({ to: input.member.email, ...email });
}
