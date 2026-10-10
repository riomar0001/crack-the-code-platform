import { z } from "zod";

import { site } from "@/lib/site";

/**
 * Accepts the organisation domain and any subdomain of it, e.g.
 * `juan@umindanao.edu.ph` and `juan@cce.umindanao.edu.ph`.
 */
const institutionalEmail = new RegExp(
  `^[^\\s@]+@([a-z0-9-]+\\.)*${site.emailDomain.replace(/\./g, "\\.")}$`,
  "i",
);

/**
 * Student ID numbers are accepted in whatever shape the registrar issues —
 * digits, letters and separators — rather than pinned to one format that
 * might not survive a change of intake year.
 */
const studentIdPattern = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

const trimmed = z.string().trim();

export const memberSchema = z.object({
  alias: trimmed
    .min(2, "Alias needs at least 2 characters.")
    .max(24, "Alias can be at most 24 characters."),
  firstName: trimmed
    .min(1, "First name is required.")
    .max(40, "First name can be at most 40 characters."),
  lastName: trimmed
    .min(1, "Last name is required.")
    .max(40, "Last name can be at most 40 characters."),
  studentId: trimmed
    .min(4, "Student ID number needs at least 4 characters.")
    .max(24, "Student ID number can be at most 24 characters.")
    .regex(studentIdPattern, "Use only letters, numbers and dashes for the student ID number.")
    .transform((value) => value.toUpperCase()),
  email: trimmed
    .min(1, "Email is required.")
    .max(120, "Email can be at most 120 characters.")
    .regex(institutionalEmail, `Use a UMindanao email (@${site.emailDomain}).`)
    .transform((value) => value.toLowerCase()),
});

export const registrationSchema = z
  .object({
    teamName: trimmed
      .min(site.minTeamNameLength, `Team name needs at least ${site.minTeamNameLength} characters.`)
      .max(
        site.maxTeamNameLength,
        `Team name can be at most ${site.maxTeamNameLength} characters.`,
      ),
    members: z
      .array(memberSchema)
      .min(site.minMembers, "A team needs at least one member.")
      .max(site.maxMembers, `A team can have at most ${site.maxMembers} members.`),
    agree: z.literal(true, { error: "Please accept the rules to continue." }),
  })
  .check((ctx) => {
    // Flag duplicates inside this submission; cross-team duplicates are caught
    // by the unique constraints in the database.
    const duplicateChecks = [
      { field: "email", label: "email", fold: false },
      { field: "studentId", label: "student ID number", fold: false },
      // Aliases feed the CTFd username "<Team Name> | <Alias>", so two members
      // sharing one would collide on the platform.
      { field: "alias", label: "alias", fold: true },
    ] as const;

    for (const { field, label, fold } of duplicateChecks) {
      const seen = new Set<string>();

      ctx.value.members.forEach((member, index) => {
        const raw = member[field];
        const value = fold ? raw.toLowerCase() : raw;

        if (!seen.has(value)) {
          seen.add(value);
          return;
        }

        ctx.issues.push({
          code: "custom",
          message: `This ${label} is already used by another member of this team.`,
          path: ["members", index, field],
          input: value,
        });
      });
    }
  });

export type MemberInput = z.infer<typeof memberSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
