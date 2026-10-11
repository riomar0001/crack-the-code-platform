import "server-only";

import type { MemberInput } from "@/lib/registration/schema";

import { listTeamMembers } from "@/lib/registration/repository";

import { sendMail } from "./mailer";
import {
  joinConfirmationEmail,
  registrationConfirmationEmail,
  squadmateJoinedEmail,
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
 * Two emails when someone joins a squad by its code:
 *   - the joiner is told they have successfully joined, and
 *   - everyone already on the squad is told who joined, in one message, so a
 *     captain notices if the code has been passed to someone unexpected.
 *
 * `roster` is the aliases from the database, captain first. The joiner sees
 * only their own real name; teammates, who share the squad, see everyone's.
 */
export async function sendJoinEmails(input: {
  teamName: string;
  teamCode: string;
  member: MemberInput;
  roster: string[];
}): Promise<void> {
  const joinerAlias = input.member.alias.toLowerCase();
  const isJoiner = (alias: string) => alias.toLowerCase() === joinerAlias;

  const joinerRoster: RosterEntry[] = input.roster.map((alias, index) => {
    const detail = [
      isJoiner(alias) ? `${fullName(input.member)} · You` : null,
      index === 0 && !isJoiner(alias) ? "Captain" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return { alias, detail: detail || undefined };
  });

  const toJoiner = joinConfirmationEmail({
    alias: input.member.alias,
    teamName: input.teamName,
    teamCode: input.teamCode,
    roster: joinerRoster,
    rulesUrl: rulesUrl(),
  });

  const tasks: Promise<unknown>[] = [sendMail({ to: input.member.email, ...toJoiner })];

  tasks.push(
    (async () => {
      const members = await listTeamMembers(input.teamCode);
      const others = members.filter((member) => !isJoiner(member.alias));

      if (others.length === 0) return;

      const toSquad = squadmateJoinedEmail({
        teamName: input.teamName,
        teamCode: input.teamCode,
        newAlias: input.member.alias,
        newName: fullName(input.member),
        rulesUrl: rulesUrl(),
        roster: members.map((member) => ({
          alias: member.alias,
          detail: [
            `${member.firstName} ${member.lastName}`,
            member.position === 0 ? "Captain" : null,
            isJoiner(member.alias) ? "New" : null,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
      });

      await sendMail({ to: others.map((member) => member.email), ...toSquad });
    })(),
  );

  // Independent: one failing (or a lookup error) must not stop the other.
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === "rejected") console.error("[mail] join notification failed:", result.reason);
  }
}
