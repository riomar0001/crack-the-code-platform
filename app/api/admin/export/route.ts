import { describeError } from "@/lib/errors";
import { adminAuthResponse, authorizeAdmin } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { listRegistrations } from "@/lib/admin/registrations";

/**
 * GET /api/admin/export
 *
 * One CSV row per member, for printing credential slips on the day.
 *
 *   curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
 *        -o credentials.csv localhost:3000/api/admin/export
 */

const HEADERS = [
  "Team",
  "Team Code",
  "Team CTFd Password",
  "Role",
  "Alias",
  "First Name",
  "Last Name",
  "Student ID",
  "Email",
  "CTFd Username",
  "CTFd Password",
  "CTFd User ID",
  "Registered At",
];

export async function GET(request: Request) {
  const auth = authorizeAdmin(request);
  if (!auth.ok) return adminAuthResponse(auth);

  try {
    const teams = await listRegistrations();

    const rows = teams.flatMap((team) =>
      team.members.map((member) => [
        team.name,
        team.teamCode,
        team.ctfdPassword,
        member.position === 0 ? "Captain" : "Member",
        member.alias,
        member.firstName,
        member.lastName,
        member.studentId,
        member.email,
        member.ctfdUsername,
        member.ctfdPassword,
        member.ctfdUserId,
        team.createdAt,
      ]),
    );

    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(toCsv(HEADERS, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ctc-credentials-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/export] failed:", describeError(error));
    return Response.json({ error: "Failed to build export." }, { status: 500 });
  }
}
