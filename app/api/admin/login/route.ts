import { adminAuthResponse, signInAdmin, startSessionCookie } from "@/lib/admin/auth";
import { describeError } from "@/lib/errors";

/**
 * POST /api/admin/login   { "email": "...", "password": "..." }
 *
 * Signs an admin in with their Supabase Auth email and password. On success
 * the session is set as an HttpOnly cookie, and the access token is returned
 * for scripts that prefer `Authorization: Bearer`:
 *
 *   curl -X POST -H "Content-Type: application/json" \
 *        -d '{"email":"you@example.com","password":"..."}' \
 *        localhost:3000/api/admin/login
 *
 * Wrong password, unknown email and non-admin email all return the same 401.
 * Supabase rate-limits sign-in attempts per IP, which is what stops guessing.
 */

const MAX_EMAIL = 254;
const MAX_PASSWORD = 256;

const bad = (message: string) =>
  Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // A JSON body cannot be sent by a plain cross-site <form>, which closes off
  // login-CSRF without needing a token.
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return bad("Send the email and password as JSON.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return bad("Send the email and password as JSON.");
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return bad("Email and password are required.");
  }

  if (email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
    return adminAuthResponse({ status: 401, message: "Invalid email or password." });
  }

  try {
    const result = await signInAdmin(email, password);

    if (!result.ok) return adminAuthResponse(result);

    return Response.json(
      {
        email: result.admin.email,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": startSessionCookie(result.accessToken, result.expiresIn),
        },
      },
    );
  } catch (error) {
    console.error("[admin/login] failed:", describeError(error));
    return Response.json({ error: "Sign-in failed. Try again." }, { status: 500 });
  }
}
