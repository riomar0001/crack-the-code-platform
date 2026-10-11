import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { generateTeamCode } from "./team-code";
import type { JoinInput, MemberInput, RegistrationInput } from "./schema";
import type { FieldErrors } from "./types";

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

/** Custom SQLSTATEs raised by `join_team` in migrations/0004_join_team.sql. */
const JOIN_ERROR = {
  teamNotFound: "CTC01",
  teamFull: "CTC02",
} as const;

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

/** The failure half of a save/join result, shared by both flows. */
type SaveFailure = { ok: false; formError?: string; fieldErrors: FieldErrors };

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

function mapUniqueViolation(error: PostgresError, members: MemberInput[]): SaveFailure {
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
    const index = members.findIndex((member) => member[conflict.field] === value);

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

    return mapUniqueViolation(error, input.members);
  }

  return {
    ok: false,
    formError: "Could not allocate a team code. Please try again.",
    fieldErrors: {},
  };
}

export type JoinResult =
  | { ok: true; teamName: string; roster: string[] }
  | { ok: false; formError?: string; fieldErrors: FieldErrors };

/**
 * Adds one member to an existing team, found by its code.
 *
 * Runs in the `join_team` Postgres function, which locks the team row, so two
 * people joining at once cannot overfill a squad.
 */
export async function joinTeam(input: JoinInput): Promise<JoinResult> {
  const { data, error } = await getSupabaseAdmin().rpc("join_team", {
    p_team_code: input.teamCode,
    p_member: input.members[0],
  });

  if (!error) {
    return { ok: true, teamName: data.teamName, roster: data.roster };
  }

  if (error.code === JOIN_ERROR.teamNotFound) {
    return {
      ok: false,
      fieldErrors: { teamCode: "No squad uses that team code. Check it with your captain." },
    };
  }

  if (error.code === JOIN_ERROR.teamFull) {
    return {
      ok: false,
      fieldErrors: { teamCode: "That squad is already full." },
    };
  }

  if (error.code !== UNIQUE_VIOLATION) {
    throw error;
  }

  return mapUniqueViolation(error, input.members);
}

export type TeamMemberContact = {
  position: number;
  alias: string;
  firstName: string;
  lastName: string;
  email: string;
};

type TeamMembersRecord = {
  team_members: {
    position: number;
    alias: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
};

/**
 * Everyone on a team, captain first, by team code. Server-only: it carries
 * email addresses, which are used to notify the squad and never sent to the
 * browser.
 */
export async function listTeamMembers(teamCode: string): Promise<TeamMemberContact[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("teams")
    .select("team_members (position, alias, first_name, last_name, email)")
    .eq("team_code", teamCode)
    .order("position", { referencedTable: "team_members", ascending: true })
    .overrideTypes<TeamMembersRecord[]>();

  if (error) throw error;

  return (data?.[0]?.team_members ?? []).map((member) => ({
    position: member.position,
    alias: member.alias,
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email,
  }));
}
