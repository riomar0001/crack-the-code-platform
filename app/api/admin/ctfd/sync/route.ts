import { describeError } from "@/lib/errors";
import { adminAuthResponse, authorizeAdmin } from "@/lib/admin/auth";
import { CtfdError, getCtfdConfig } from "@/lib/ctfd/client";
import { syncToCtfd } from "@/lib/ctfd/sync";

/**
 * POST /api/admin/ctfd/sync
 *
 * Pushes registered teams and members into CTFd. Re-runnable: rows already
 * carrying a CTFd id are skipped.
 *
 * Preview without writing anything:
 *   curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \
 *        "localhost:3000/api/admin/ctfd/sync?dryRun=true"
 *
 * Requires CTFD_URL and CTFD_ADMIN_TOKEN.
 */

// Pushing a few hundred accounts takes a while; stay under the platform cap.
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return adminAuthResponse(auth);

  const config = getCtfdConfig();

  if (!config) {
    return Response.json(
      { error: "CTFd is not configured. Set CTFD_URL and CTFD_ADMIN_TOKEN." },
      { status: 503 },
    );
  }

  // Default to a dry run: this writes to an external system, so the
  // destructive-ish path has to be asked for explicitly.
  const dryRun = new URL(request.url).searchParams.get("dryRun") !== "false";

  try {
    const report = await syncToCtfd(config, dryRun);

    return Response.json(report, {
      status: report.failed > 0 ? 207 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[admin/ctfd/sync] failed:", describeError(error));

    if (error instanceof CtfdError) {
      return Response.json(
        { error: error.message, status: error.status, detail: error.detail },
        { status: 502 },
      );
    }

    return Response.json({ error: "Sync failed." }, { status: 500 });
  }
}
