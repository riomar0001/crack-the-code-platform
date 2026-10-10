import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { generateTeamCode } from "./team-code";
import type { RegistrationInput } from "./schema";
import type { FieldErrors } from "./types";

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

/** Constraint names declared in supabase/migrations/0001_init.sql. */
const CONSTRAINT = {
  teamName: "teams_name_unique",
  teamCode: "teams_code_unique",
  memberEmail: "team_members_email_unique",
  memberStudentId: "team_members_student_id_unique",
  memberAlias: "team_members_team_alias_unique",
  /** Derived from team name + alias, so a clash means a duplicate alias. */
  ctfdUsername: "team_members_ctfd_username_unique",
} as const;

/** How many times to re-roll a team code before giving up on a collision. */
const CODE_ATTEMPTS = 5;

export type SaveResult =
  | { ok: true; teamCode: string }
  | { ok: false; formError?: string; fieldErrors: FieldErrors };

type PostgresError = { code?: string; message?: string; details?: string };

function mentions(error: PostgresError, constraint: string): boolean {
  return `${error.message ?? ""} ${error.details ?? ""}`.includes(constraint);
}

/**
 * Pulls the offending value out of a unique-violation detail string, which
 * Postgres formats as: `Key (email)=(juan@umindanao.edu.ph) already exists.`
 */
function conflictingValue(error: PostgresError): string | null {
  return error.details?.match(/Key \([^)]+\)=\(([^)]*)\)/)?.[1] ?? null;
}

function mapUniqueViolation(error: PostgresError, input: RegistrationInput): SaveResult {
  if (mentions(error, CONSTRAINT.teamName)) {
    return {
      ok: false,
      fieldErrors: { teamName: "That team name is already taken. Pick another." },
    };
  }

  // Both of these point at one specific member, so resolve which row to flag
  // by matching the conflicting value back against the submission.
  const memberConflicts = [
    {
      constraint: CONSTRAINT.memberEmail,
      field: "email",
      message: "This email is already registered with another team.",
      normalize: (value: string) => value.toLowerCase(),
    },
    {
      constraint: CONSTRAINT.memberStudentId,
      field: "studentId",
      message: "This student ID number is already registered with another team.",
      normalize: (value: string) => value.toUpperCase(),
    },
  ] as const;

  for (const conflict of memberConflicts) {
    if (!mentions(error, conflict.constraint)) continue;

    const raw = conflictingValue(error);
    const value = raw ? conflict.normalize(raw) : null;
    const index = input.members.findIndex((member) => member[conflict.field] === value);

    return index >= 0
      ? { ok: false, fieldErrors: { [`members.${index}.${conflict.field}`]: conflict.message } }
      : { ok: false, formError: conflict.message, fieldErrors: {} };
  }

  // Duplicate aliases within the squad. Zod catches these first, so reaching
  // here means a race between two concurrent submissions.
  if (mentions(error, CONSTRAINT.memberAlias) || mentions(error, CONSTRAINT.ctfdUsername)) {
    return {
      ok: false,
      formError: "Each member needs a different alias. Please adjust and try again.",
      fieldErrors: {},
    };
  }

  return {
    ok: false,
    formError: "That registration conflicts with an existing one. Please review your details.",
    fieldErrors: {},
  };
}

/**
 * Persists a validated registration.
 *
 * The insert runs inside the `register_team` Postgres function so the team and
 * its members land atomically — a duplicate email on the fourth member rolls
 * back the whole squad rather than leaving a half-registered team behind.
 */
export async function saveRegistration(input: RegistrationInput): Promise<SaveResult> {
  const supabase = getSupabaseAdmin();

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const teamCode = generateTeamCode();

    const { error } = await supabase.rpc("register_team", {
      p_team_name: input.teamName,
      p_team_code: teamCode,
      p_members: input.members,
    });

    if (!error) {
      return { ok: true, teamCode };
    }

    if (error.code !== UNIQUE_VIOLATION) {
      throw error;
    }

    // A code collision is purely our own bad luck — re-roll and try again.
    if (mentions(error, CONSTRAINT.teamCode)) {
      continue;
    }

    return mapUniqueViolation(error, input);
  }

  return {
    ok: false,
    formError: "Could not allocate a team code. Please try again.",
    fieldErrors: {},
  };
}
