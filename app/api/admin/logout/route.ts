import { endSessionCookie, isSameOrigin } from "@/lib/admin/auth";

/**
 * POST /api/admin/logout
 *
 * Ends the browser session by expiring the cookie. Needs no sign-in (signing
 * out when already signed out is harmless) but must come from this site, so
 * another page cannot log an admin out.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store", "Set-Cookie": endSessionCookie() } },
  );
}
