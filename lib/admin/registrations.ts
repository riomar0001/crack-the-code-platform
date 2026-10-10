import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Shape returned to the admin endpoints: a team with its roster attached. */
export type RegistrationMember = {
  position: number;
  alias: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  ctfdUsername: string;
  ctfdPassword: string;
  ctfdUserId: number | null;
  ctfdSyncedAt: string | null;
};

export type RegistrationTeam = {
  id: string;
  name: string;
  teamCode: string;
  ctfdPassword: string;
  ctfdTeamId: number | null;
  ctfdSyncedAt: string | null;
  createdAt: string;
  members: RegistrationMember[];
};

const SELECT = `
  id, name, team_code, ctfd_password, ctfd_team_id, ctfd_synced_at, created_at,
  team_members (
    position, alias, first_name, last_name, student_id, email,
    ctfd_username, ctfd_password, ctfd_user_id, ctfd_synced_at
  )
`;

type TeamRecord = {
  id: string;
  name: string;
  team_code: string;
  ctfd_password: string;
  ctfd_team_id: number | null;
  ctfd_synced_at: string | null;
  created_at: string;
  team_members: {
    position: number;
    alias: string;
    first_name: string;
    last_name: string;
    student_id: string;
    email: string;
    ctfd_username: string;
    ctfd_password: string;
    ctfd_user_id: number | null;
    ctfd_synced_at: string | null;
  }[];
};

/** Every registration, teams in signup order and members captain-first. */
export async function listRegistrations(): Promise<RegistrationTeam[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("teams")
    .select(SELECT)
    .order("created_at", { ascending: true })
    .order("position", { referencedTable: "team_members", ascending: true })
    .overrideTypes<TeamRecord[]>();

  if (error) throw error;

  return (data ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    teamCode: team.team_code,
    ctfdPassword: team.ctfd_password,
    ctfdTeamId: team.ctfd_team_id,
    ctfdSyncedAt: team.ctfd_synced_at,
    createdAt: team.created_at,
    members: team.team_members.map((member) => ({
      position: member.position,
      alias: member.alias,
      firstName: member.first_name,
      lastName: member.last_name,
      studentId: member.student_id,
      email: member.email,
      ctfdUsername: member.ctfd_username,
      ctfdPassword: member.ctfd_password,
      ctfdUserId: member.ctfd_user_id,
      ctfdSyncedAt: member.ctfd_synced_at,
    })),
  }));
}

/** Records the CTFd team id after a successful push. */
export async function markTeamSynced(teamId: string, ctfdTeamId: number): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("teams")
    .update({ ctfd_team_id: ctfdTeamId, ctfd_synced_at: new Date().toISOString() })
    .eq("id", teamId);

  if (error) throw error;
}

/** Records the CTFd user id after a successful push. */
export async function markMemberSynced(
  teamId: string,
  position: number,
  ctfdUserId: number,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("team_members")
    .update({ ctfd_user_id: ctfdUserId, ctfd_synced_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .eq("position", position);

  if (error) throw error;
}
