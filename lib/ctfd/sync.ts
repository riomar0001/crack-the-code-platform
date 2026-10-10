import "server-only";

import {
  listRegistrations,
  markMemberSynced,
  markTeamSynced,
  type RegistrationTeam,
} from "@/lib/admin/registrations";

import {
  addTeamMember,
  createTeam,
  createUser,
  findTeamByName,
  findUserByEmail,
  verifyConnection,
  type CtfdConfig,
} from "./client";

/**
 * Pushes registrations into CTFd.
 *
 * Re-runnable by design: anything already carrying a CTFd id is skipped, and
 * rows without one are matched against CTFd by team name / email before being
 * created. That covers the case where a previous run created the record but
 * died before writing the id back.
 */

export type SyncAction = "created" | "linked" | "skipped" | "failed";

export type SyncEntry = {
  kind: "team" | "member";
  label: string;
  action: SyncAction;
  ctfdId?: number;
  error?: string;
};

export type SyncReport = {
  dryRun: boolean;
  teams: number;
  members: number;
  created: number;
  linked: number;
  skipped: number;
  failed: number;
  entries: SyncEntry[];
};

const describe = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

async function syncTeam(
  config: CtfdConfig,
  team: RegistrationTeam,
  dryRun: boolean,
  entries: SyncEntry[],
): Promise<number | null> {
  if (team.ctfdTeamId !== null) {
    entries.push({ kind: "team", label: team.name, action: "skipped", ctfdId: team.ctfdTeamId });
    return team.ctfdTeamId;
  }

  if (dryRun) {
    entries.push({ kind: "team", label: team.name, action: "created" });
    return null;
  }

  try {
    // Adopt an existing CTFd team rather than failing on a name clash.
    const existing = await findTeamByName(config, team.name);

    if (existing) {
      await markTeamSynced(team.id, existing.id);
      entries.push({ kind: "team", label: team.name, action: "linked", ctfdId: existing.id });
      return existing.id;
    }

    const created = await createTeam(config, {
      name: team.name,
      password: team.ctfdPassword,
      email: team.members[0]?.email,
    });

    await markTeamSynced(team.id, created.id);
    entries.push({ kind: "team", label: team.name, action: "created", ctfdId: created.id });
    return created.id;
  } catch (error) {
    entries.push({ kind: "team", label: team.name, action: "failed", error: describe(error) });
    return null;
  }
}

async function syncMembers(
  config: CtfdConfig,
  team: RegistrationTeam,
  ctfdTeamId: number,
  dryRun: boolean,
  entries: SyncEntry[],
): Promise<void> {
  for (const member of team.members) {
    const label = member.ctfdUsername;

    if (member.ctfdUserId !== null) {
      entries.push({ kind: "member", label, action: "skipped", ctfdId: member.ctfdUserId });
      continue;
    }

    if (dryRun) {
      entries.push({ kind: "member", label, action: "created" });
      continue;
    }

    try {
      const existing = await findUserByEmail(config, member.email);

      const user =
        existing ??
        (await createUser(config, {
          name: member.ctfdUsername,
          email: member.email,
          password: member.ctfdPassword,
        }));

      // Joining a team the user is already on is a no-op worth tolerating.
      try {
        await addTeamMember(config, ctfdTeamId, user.id);
      } catch (error) {
        if (!existing) throw error;
      }

      await markMemberSynced(team.id, member.position, user.id);

      entries.push({
        kind: "member",
        label,
        action: existing ? "linked" : "created",
        ctfdId: user.id,
      });
    } catch (error) {
      entries.push({ kind: "member", label, action: "failed", error: describe(error) });
    }
  }
}

export async function syncToCtfd(config: CtfdConfig, dryRun: boolean): Promise<SyncReport> {
  // Fail fast on bad credentials instead of part-way through the roster.
  if (!dryRun) await verifyConnection(config);

  const registrations = await listRegistrations();
  const entries: SyncEntry[] = [];

  for (const team of registrations) {
    const ctfdTeamId = await syncTeam(config, team, dryRun, entries);

    if (ctfdTeamId === null && !dryRun) {
      // The team failed, so its members have nothing to join.
      for (const member of team.members) {
        entries.push({
          kind: "member",
          label: member.ctfdUsername,
          action: "failed",
          error: "Team was not created.",
        });
      }
      continue;
    }

    await syncMembers(config, team, ctfdTeamId ?? 0, dryRun, entries);
  }

  const count = (action: SyncAction) => entries.filter((e) => e.action === action).length;

  return {
    dryRun,
    teams: registrations.length,
    members: registrations.reduce((total, team) => total + team.members.length, 0),
    created: count("created"),
    linked: count("linked"),
    skipped: count("skipped"),
    failed: count("failed"),
    entries,
  };
}
