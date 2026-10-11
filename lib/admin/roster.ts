import { toCsv } from "./csv";
import type { RegistrationTeam } from "./registrations";

/** The authenticated teams endpoint omits only the internal database id. */
export type AdminTeam = Omit<RegistrationTeam, "id">;
export type SyncFilter = "all" | "pending" | "synced";

export function isTeamSynced(team: AdminTeam): boolean {
  return team.ctfdTeamId !== null && team.members.every((member) => member.ctfdUserId !== null);
}

export function filterTeams(teams: AdminTeam[], query: string, status: SyncFilter): AdminTeam[] {
  const needle = query.trim().toLowerCase();
  return teams.filter((team) => {
    if (status === "synced" && !isTeamSynced(team)) return false;
    if (status === "pending" && isTeamSynced(team)) return false;
    const fields = [team.name, team.teamCode, ...team.members.flatMap((member) => [
      member.alias, `${member.firstName} ${member.lastName}`, member.studentId,
      member.email, member.ctfdUsername,
    ])];
    return !needle || fields.some((field) => field.toLowerCase().includes(needle));
  });
}

export function registrationsCsv(teams: AdminTeam[], credentials = false): string {
  const headers = [
    "Team", "Team Code", ...(credentials ? ["Team CTFd Password"] : []),
    "Role", "Alias", "First Name", "Last Name", "Student ID", "Email",
    "CTFd Username", ...(credentials ? ["CTFd Password"] : []), "CTFd User ID", "Registered At",
  ];
  const rows = teams.flatMap((team) => team.members.map((member) => [
    team.name, team.teamCode, ...(credentials ? [team.ctfdPassword] : []),
    member.position === 0 ? "Captain" : "Member", member.alias, member.firstName,
    member.lastName, member.studentId, member.email, member.ctfdUsername,
    ...(credentials ? [member.ctfdPassword] : []), member.ctfdUserId, team.createdAt,
  ]));
  return toCsv(headers, rows);
}

export function teamCredentials(team: AdminTeam): string {
  return [
    `Team: ${team.name}`, `Team code: ${team.teamCode}`, `Team CTFd password: ${team.ctfdPassword}`,
    ...team.members.map((member) => [
      "", `${member.position === 0 ? "Captain" : "Member"}: ${member.firstName} ${member.lastName} (${member.alias})`,
      `CTFd username: ${member.ctfdUsername}`, `CTFd password: ${member.ctfdPassword}`,
    ].join("\n")),
  ].join("\n");
}
