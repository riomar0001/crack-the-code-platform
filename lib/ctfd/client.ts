import "server-only";

/**
 * Thin client for the CTFd v3 admin API.
 *
 * Auth uses a CTFd access token (Settings → Access Tokens), sent as
 * `Authorization: Token <token>` — CTFd's own scheme, not Bearer.
 *
 * Only the handful of endpoints the sync needs are wrapped. CTFd returns
 * `{ success: boolean, data?: ..., errors?: ... }` on these routes.
 */

export type CtfdConfig = {
  baseUrl: string;
  token: string;
};

export class CtfdError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "CtfdError";
  }
}

type CtfdEnvelope<T> = {
  success: boolean;
  data?: T;
  errors?: unknown;
  message?: string;
};

export function getCtfdConfig(): CtfdConfig | null {
  const baseUrl = process.env.CTFD_URL?.replace(/\/+$/, "");
  const token = process.env.CTFD_ADMIN_TOKEN;

  return baseUrl && token ? { baseUrl, token } : null;
}

async function request<T>(
  config: CtfdConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${config.baseUrl}/api/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Token ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const text = await response.text();
  let payload: CtfdEnvelope<T> | undefined;

  try {
    payload = text ? (JSON.parse(text) as CtfdEnvelope<T>) : undefined;
  } catch {
    // CTFd serves an HTML error page when the token or URL is wrong.
    throw new CtfdError(
      `CTFd returned non-JSON (${response.status}) for ${path}. Check CTFD_URL and CTFD_ADMIN_TOKEN.`,
      response.status,
      text.slice(0, 200),
    );
  }

  if (!response.ok || payload?.success === false) {
    throw new CtfdError(
      payload?.message ?? `CTFd request failed (${response.status}) for ${path}`,
      response.status,
      payload?.errors ?? payload,
    );
  }

  return payload?.data as T;
}

/* -------------------------------------------------------------------------
   Teams
   ------------------------------------------------------------------------- */

export type CtfdTeam = { id: number; name: string };

export function createTeam(
  config: CtfdConfig,
  input: { name: string; password: string; email?: string },
): Promise<CtfdTeam> {
  return request<CtfdTeam>(config, "/teams", { method: "POST", body: input });
}

export async function findTeamByName(
  config: CtfdConfig,
  name: string,
): Promise<CtfdTeam | null> {
  const results = await request<CtfdTeam[]>(
    config,
    `/teams?field=name&q=${encodeURIComponent(name)}`,
  );

  // CTFd's search is a substring match, so confirm an exact hit.
  return results?.find((team) => team.name === name) ?? null;
}

/* -------------------------------------------------------------------------
   Users
   ------------------------------------------------------------------------- */

export type CtfdUser = { id: number; name: string; email: string };

export function createUser(
  config: CtfdConfig,
  input: { name: string; email: string; password: string },
): Promise<CtfdUser> {
  return request<CtfdUser>(config, "/users", {
    method: "POST",
    body: { ...input, type: "user", verified: true, hidden: false, banned: false },
  });
}

export async function findUserByEmail(
  config: CtfdConfig,
  email: string,
): Promise<CtfdUser | null> {
  const results = await request<CtfdUser[]>(
    config,
    `/users?field=email&q=${encodeURIComponent(email)}`,
  );

  return results?.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Adds an existing user to an existing team. */
export function addTeamMember(
  config: CtfdConfig,
  teamId: number,
  userId: number,
): Promise<unknown> {
  return request(config, `/teams/${teamId}/members`, {
    method: "POST",
    body: { user_id: userId },
  });
}

/** Cheap credential check used by the sync endpoint before it writes anything. */
export async function verifyConnection(config: CtfdConfig): Promise<void> {
  await request(config, "/users?per_page=1");
}
