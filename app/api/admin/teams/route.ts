import { describeError } from "@/lib/errors";
import { adminAuthResponse, authorizeAdmin } from "@/lib/admin/auth";
import { listRegistrations } from "@/lib/admin/registrations";

/**
 * GET /api/admin/teams
 *
 * Every registration as JSON, including CTFd credentials.
 * Pass `?credentials=false` to omit the passwords.
 *
 *   curl -H "Authorization: Bearer $ADMIN_API_TOKEN" localhost:3000/api/admin/teams
 */
export async function GET(request: Request) {
  const auth = authorizeAdmin(request);
  if (!auth.ok) return adminAuthResponse(auth);

  const includeCredentials =
    new URL(request.url).searchParams.get("credentials") !== "false";

  try {
    const teams = await listRegistrations();

    const payload = teams.map((team) => ({
      name: team.name,
      teamCode: team.teamCode,
      createdAt: team.createdAt,
      ctfdTeamId: team.ctfdTeamId,
      ctfdSyncedAt: team.ctfdSyncedAt,
      ...(includeCredentials ? { ctfdPassword: team.ctfdPassword } : {}),
      members: team.members.map((member) => ({
        position: member.position,
        role: member.position === 0 ? "captain" : "member",
        alias: member.alias,
        firstName: member.firstName,
        lastName: member.lastName,
        studentId: member.studentId,
        email: member.email,
        ctfdUsername: member.ctfdUsername,
        ctfdUserId: member.ctfdUserId,
        ctfdSyncedAt: member.ctfdSyncedAt,
        ...(includeCredentials ? { ctfdPassword: member.ctfdPassword } : {}),
      })),
    }));

    return Response.json(
      { teams: payload, count: payload.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/teams] failed:", describeError(error));
    return Response.json({ error: "Failed to load registrations." }, { status: 500 });
  }
}
