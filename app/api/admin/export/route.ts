import { describeError } from "@/lib/errors";
import { adminAuthResponse, authorizeAdmin } from "@/lib/admin/auth";
import { registrationsCsv } from "@/lib/admin/roster";
import { listRegistrations } from "@/lib/admin/registrations";

/**
 * GET /api/admin/export
 *
 * One CSV row per member, for printing credential slips on the day.
 *
 *   curl -H "Authorization: Bearer $ACCESS_TOKEN" \
 *        -o credentials.csv localhost:3000/api/admin/export
 */

export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return adminAuthResponse(auth);

  try {
    const teams = await listRegistrations();

    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(registrationsCsv(teams, true), {
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
