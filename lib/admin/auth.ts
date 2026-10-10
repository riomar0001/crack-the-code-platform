import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Bearer-token guard for the admin endpoints.
 *
 * These routes serve plaintext CTFd passwords, so the rules are deliberately
 * strict:
 *
 *   - No token configured means the API is **off** (503), never open.
 *   - A short token is rejected at the door rather than quietly accepted.
 *   - Comparison is constant time over SHA-256 digests, so neither the token's
 *     length nor its matching prefix leaks through response timing.
 *
 * Generate one with:  openssl rand -hex 32
 */

const MIN_TOKEN_LENGTH = 24;

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export type AdminAuthFailure = {
  status: 401 | 503;
  message: string;
};

export type AdminAuthResult = { ok: true } | ({ ok: false } & AdminAuthFailure);

export function authorizeAdmin(request: Request): AdminAuthResult {
  const expected = process.env.ADMIN_API_TOKEN;

  if (!expected) {
    return {
      ok: false,
      status: 503,
      message: "Admin API is disabled. Set ADMIN_API_TOKEN to enable it.",
    };
  }

  if (expected.length < MIN_TOKEN_LENGTH) {
    return {
      ok: false,
      status: 503,
      message: `Admin API is disabled: ADMIN_API_TOKEN must be at least ${MIN_TOKEN_LENGTH} characters.`,
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (!token) {
    return { ok: false, status: 401, message: "Missing bearer token." };
  }

  return timingSafeEqual(digest(token), digest(expected))
    ? { ok: true }
    : { ok: false, status: 401, message: "Invalid token." };
}

/** Standard JSON rejection, with the challenge header on a 401. */
export function adminAuthResponse(failure: AdminAuthFailure): Response {
  return Response.json(
    { error: failure.message },
    {
      status: failure.status,
      headers: failure.status === 401 ? { "WWW-Authenticate": "Bearer" } : undefined,
    },
  );
}
