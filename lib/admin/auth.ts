import "server-only";

import type { User } from "@supabase/supabase-js";

import { getSupabaseAuth } from "@/lib/supabase/auth";

/**
 * Admin sign-in and request authorization.
 *
 * Admins are Supabase Auth users (email + password, created in the Supabase
 * dashboard). Being a Supabase user is not enough: the email must also be on
 * the `ADMIN_EMAILS` allowlist, so an account that exists for any other reason
 * — or a stray sign-up — gets nothing.
 *
 * These routes serve plaintext CTFd passwords, so the rules are strict:
 *
 *   - No `ADMIN_EMAILS` means the admin area is **off** (503), never open.
 *   - The email must be confirmed, and every request re-checks the session
 *     with Supabase rather than trusting a cookie's contents.
 *   - The session lives in an HttpOnly cookie, out of reach of page scripts.
 *   - A wrong password, an unknown email and a non-admin email all get the
 *     same answer, so the form cannot be used to discover who is an admin.
 *
 * Programmatic callers may instead send the session's access token as
 * `Authorization: Bearer <token>` (it is returned by `POST /api/admin/login`).
 */

export const ADMIN_SESSION_COOKIE = "ctc_admin_session";

/** Fallback when Supabase does not report a lifetime. */
const DEFAULT_SESSION_SECONDS = 3600;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type AdminUser = { id: string; email: string };

export type AdminAuthFailure = {
  status: 401 | 403 | 503;
  message: string;
};

export type AdminAuthResult =
  | { ok: true; admin: AdminUser }
  | ({ ok: false } & AdminAuthFailure);

export type AdminSignInResult =
  | { ok: true; admin: AdminUser; accessToken: string; expiresIn: number }
  | ({ ok: false } & AdminAuthFailure);

const NOT_CONFIGURED: AdminAuthFailure = {
  status: 503,
  message: "Admin sign-in is disabled. Set ADMIN_EMAILS to enable it.",
};

const INVALID_LOGIN: AdminAuthFailure = { status: 401, message: "Invalid email or password." };

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const isAdminAuthConfigured = () => adminEmails().length > 0;

/** A Supabase user is an admin only if confirmed and on the allowlist. */
function toAdmin(user: User | null | undefined): AdminUser | null {
  if (!user?.email || !user.email_confirmed_at) return null;
  return adminEmails().includes(user.email.toLowerCase())
    ? { id: user.id, email: user.email }
    : null;
}

/** Validates an access token with Supabase and applies the allowlist. */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  if (!token || !isAdminAuthConfigured()) return null;

  const { data, error } = await getSupabaseAuth().auth.getUser(token);
  return error ? null : toAdmin(data.user);
}

export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  if (!isAdminAuthConfigured()) return { ok: false, ...NOT_CONFIGURED };

  const { data, error } = await getSupabaseAuth().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  const admin = error || !data.session ? null : toAdmin(data.user);

  if (!admin || !data.session) return { ok: false, ...INVALID_LOGIN };

  return {
    ok: true,
    admin,
    accessToken: data.session.access_token,
    expiresIn: data.session.expires_in || DEFAULT_SESSION_SECONDS,
  };
}

/* -------------------------------------------------------------------------
   Cookies
   ------------------------------------------------------------------------- */

function readCookie(request: Request, name: string): string {
  const header = request.headers.get("cookie") ?? "";

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;

    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return "";
      }
    }
  }

  return "";
}

function sessionCookie(value: string, maxAge: number): string {
  return [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    // Lax keeps the cookie off cross-site POSTs; mutating routes also check Origin.
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** `Set-Cookie` value that starts a session lasting `expiresIn` seconds. */
export const startSessionCookie = (accessToken: string, expiresIn: number) =>
  sessionCookie(accessToken, expiresIn);

/** `Set-Cookie` value that ends the session. */
export const endSessionCookie = () => sessionCookie("", 0);

/* -------------------------------------------------------------------------
   Request authorization
   ------------------------------------------------------------------------- */

/** A browser request that changes something must come from this site. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function authorizeAdmin(request: Request): Promise<AdminAuthResult> {
  if (!isAdminAuthConfigured()) return { ok: false, ...NOT_CONFIGURED };

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const token = bearer || readCookie(request, ADMIN_SESSION_COOKIE);

  if (!token) return { ok: false, status: 401, message: "Sign in required." };

  // Only a cookie is sent automatically by the browser, so only a cookie needs
  // the cross-site check; a bearer token has to be attached on purpose.
  if (!bearer && !SAFE_METHODS.has(request.method) && !isSameOrigin(request)) {
    return { ok: false, status: 403, message: "Cross-site request blocked." };
  }

  const admin = await verifyAdminToken(token);

  return admin
    ? { ok: true, admin }
    : { ok: false, status: 401, message: "Your session is invalid or has expired. Sign in again." };
}

/** Standard JSON rejection, with the challenge header on a 401. */
export function adminAuthResponse(failure: AdminAuthFailure): Response {
  return Response.json(
    { error: failure.message },
    {
      status: failure.status,
      headers: {
        "Cache-Control": "no-store",
        ...(failure.status === 401 ? { "WWW-Authenticate": "Bearer" } : {}),
      },
    },
  );
}
