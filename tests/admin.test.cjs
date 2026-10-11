const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Compile the actual small TS modules in memory; no generated files or runtime
// dependencies. Server-only is a build boundary, not needed in these Node tests.
function loadTs(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (id.startsWith(".")) return loadTs(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${id}.ts`)), mocks);
    if (id.startsWith("@/")) return loadTs(`${id.slice(2)}.ts`, mocks);
    return require(id);
  };
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

const { filterTeams, isTeamSynced, registrationsCsv, teamCredentials } = loadTs("lib/admin/roster.ts");
const team = {
  name: '=HYPERLINK("example")', teamCode: "CTC-1234", ctfdPassword: "TEAM_SECRET",
  ctfdTeamId: 7, ctfdSyncedAt: null, createdAt: "2026-10-11T00:00:00Z",
  members: [{ position: 0, alias: "Captain, One", firstName: "José", lastName: "Santos",
    studentId: "001234", email: "jose@example.test", ctfdUsername: "Squad | Captain",
    ctfdPassword: "MEMBER_SECRET", ctfdUserId: 9, ctfdSyncedAt: null }],
};

test("search covers participant and team fields, ignores case and whitespace", () => {
  for (const query of [" ctc-1234 ", "JOSÉ SANTOS", "001234", "jose@", "captain"]) {
    assert.equal(filterTeams([team], query, "all").length, 1);
  }
  assert.equal(filterTeams([team], "absent", "all").length, 0);
});

test("a team is synced only when the team and all participants are linked", () => {
  assert.equal(isTeamSynced(team), true);
  const pending = { ...team, members: [{ ...team.members[0], ctfdUserId: null }] };
  assert.equal(isTeamSynced(pending), false);
  assert.equal(isTeamSynced({ ...team, ctfdTeamId: null }), false);
  assert.deepEqual(filterTeams([team, pending], "", "pending"), [pending]);
  assert.deepEqual(filterTeams([team, pending], "", "synced"), [team]);
});

test("CSV excludes passwords by default and safely escapes spreadsheet cells", () => {
  const csv = registrationsCsv([team]);
  assert.ok(csv.startsWith("\uFEFFTeam,Team Code,Role,"));
  assert.ok(!csv.includes("SECRET"));
  assert.ok(!csv.includes("Password"));
  assert.ok(csv.includes('"\'=HYPERLINK(""example"")"'));
  assert.ok(csv.includes('"Captain, One"'));
  assert.ok(csv.includes("José"));
  assert.ok(csv.endsWith("\r\n"));
  assert.ok(registrationsCsv([team], true).includes("TEAM_SECRET"));
  assert.ok(registrationsCsv([team], true).includes("MEMBER_SECRET"));
});

test("exports all filtered teams, not just a screen of results", () => {
  const teams = Array.from({ length: 27 }, (_, i) => ({ ...team, teamCode: `CTC-${i}` }));
  assert.equal(registrationsCsv(filterTeams(teams, "", "all")).trim().split("\r\n").length, 28);
  assert.equal(registrationsCsv([]).trim().split("\r\n").length, 1);
  assert.ok(teamCredentials(team).includes("CTFd password: MEMBER_SECRET"));
});

// Fake Supabase Auth: one confirmed admin, one confirmed non-admin, one
// unconfirmed admin. Tokens are "tok:<email>" so the fake can answer getUser.
const users = {
  "admin@example.test": { id: "u1", email: "admin@example.test", email_confirmed_at: "2026-01-01" },
  "reader@example.test": { id: "u2", email: "reader@example.test", email_confirmed_at: "2026-01-01" },
  "pending@example.test": { id: "u3", email: "pending@example.test", email_confirmed_at: null },
};
const passwords = { "admin@example.test": "correct horse", "reader@example.test": "pw", "pending@example.test": "pw" };
const fakeAuth = {
  auth: {
    async getUser(token) {
      const user = users[String(token).replace(/^tok:/, "")];
      return user ? { data: { user }, error: null } : { data: { user: null }, error: new Error("bad token") };
    },
    async signInWithPassword({ email, password }) {
      const user = users[email];
      if (!user || passwords[email] !== password) return { data: {}, error: new Error("invalid") };
      return { data: { user, session: { access_token: `tok:${email}`, expires_in: 1800 } }, error: null };
    },
  },
};

async function withAdminEnv(emails, run) {
  const previous = process.env.ADMIN_EMAILS;
  try {
    if (emails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = emails;
    await run();
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
}

test("API rejects unauthenticated requests before reading registrations", async () => {
  let reads = 0;
  const mocks = {
    "@/lib/supabase/auth": { getSupabaseAuth: () => fakeAuth },
    "@/lib/admin/registrations": { listRegistrations: async () => { reads++; return [team]; } },
  };
  await withAdminEnv("Admin@Example.test, other@example.test", async () => {
    const teamsApi = loadTs("app/api/admin/teams/route.ts", mocks);
    const exportApi = loadTs("app/api/admin/export/route.ts", mocks);
    const url = "http://localhost/api/admin/teams";
    const as = (headers) => new Request(url, { headers });

    for (const api of [teamsApi, exportApi]) {
      assert.equal((await api.GET(as({}))).status, 401, "no credentials");
      assert.equal((await api.GET(as({ Authorization: "Bearer nonsense" }))).status, 401, "unknown token");
      assert.equal((await api.GET(as({ Authorization: "Bearer tok:reader@example.test" }))).status, 401, "valid user, not on the allowlist");
      assert.equal((await api.GET(as({ Authorization: "Bearer tok:pending@example.test" }))).status, 401, "unconfirmed email");
      assert.equal((await api.GET(as({ Cookie: "ctc_admin_session=tok%3Anonsense" }))).status, 401, "bad cookie");
    }
    assert.equal(reads, 0, "registrations must not be read before authorization");

    // Allowlist matching ignores case and surrounding spaces.
    const bearer = await teamsApi.GET(new Request(`${url}?credentials=false`, { headers: { Authorization: "Bearer tok:admin@example.test" } }));
    assert.equal(bearer.status, 200);
    assert.equal(bearer.headers.get("cache-control"), "no-store");
    const body = await bearer.text();
    assert.ok(!body.includes("SECRET"));
    assert.equal(JSON.parse(body).admin, "admin@example.test");

    // The browser's cookie works too, and so does the CSV export with it.
    const cookie = await exportApi.GET(as({ Cookie: "ctc_admin_session=tok%3Aadmin%40example.test" }));
    assert.equal(cookie.status, 200);
    assert.ok((await cookie.text()).includes("MEMBER_SECRET"));
  });

  await withAdminEnv(undefined, async () => {
    const teamsApi = loadTs("app/api/admin/teams/route.ts", mocks);
    assert.equal((await teamsApi.GET(new Request("http://localhost/api/admin/teams", { headers: { Authorization: "Bearer tok:admin@example.test" } }))).status, 503, "no allowlist means off, never open");
  });
});

test("cookie sessions cannot be used for cross-site writes; bearer tokens can", async () => {
  const mocks = { "@/lib/supabase/auth": { getSupabaseAuth: () => fakeAuth } };
  await withAdminEnv("admin@example.test", async () => {
    const { authorizeAdmin } = loadTs("lib/admin/auth.ts", mocks);
    const cookie = "ctc_admin_session=tok%3Aadmin%40example.test";
    const post = (headers) => new Request("https://site.test/api/admin/ctfd/sync", { method: "POST", headers });

    assert.equal((await authorizeAdmin(post({ Cookie: cookie }))).status, 403, "no Origin");
    assert.equal((await authorizeAdmin(post({ Cookie: cookie, Origin: "https://evil.test" }))).status, 403, "foreign Origin");
    assert.equal((await authorizeAdmin(post({ Cookie: cookie, Origin: "https://site.test" }))).ok, true, "same Origin");
    // A bearer token is attached on purpose, so it needs no Origin.
    assert.equal((await authorizeAdmin(post({ Authorization: "Bearer tok:admin@example.test" }))).ok, true);
  });
});

test("login gives every failure the same answer and sets an HttpOnly session cookie on success", async () => {
  const mocks = { "@/lib/supabase/auth": { getSupabaseAuth: () => fakeAuth } };
  await withAdminEnv("admin@example.test", async () => {
    const { POST } = loadTs("app/api/admin/login/route.ts", mocks);
    const login = (body, type = "application/json") =>
      POST(new Request("http://localhost/api/admin/login", { method: "POST", headers: { "Content-Type": type }, body: typeof body === "string" ? body : JSON.stringify(body) }));

    const failures = await Promise.all([
      login({ email: "admin@example.test", password: "wrong" }),
      login({ email: "nobody@example.test", password: "pw" }),
      login({ email: "reader@example.test", password: "pw" }),
      login({ email: "pending@example.test", password: "pw" }),
    ]);
    const answers = await Promise.all(failures.map(async (r) => [r.status, (await r.json()).error, r.headers.get("set-cookie")]));
    for (const answer of answers) assert.deepEqual(answer, [401, "Invalid email or password.", null]);

    assert.equal((await login("not json")).status, 400);
    assert.equal((await login({ email: "admin@example.test" })).status, 400);
    assert.equal((await login({ email: "admin@example.test", password: "correct horse" }, "text/plain")).status, 400, "a plain form post is refused");

    const ok = await login({ email: "Admin@Example.test", password: "correct horse" });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).email, "admin@example.test");
    const cookie = ok.headers.get("set-cookie");
    assert.match(cookie, /^ctc_admin_session=tok%3Aadmin%40example\.test;/);
    for (const flag of ["HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=1800"]) assert.ok(cookie.includes(flag), flag);
  });

  await withAdminEnv(undefined, async () => {
    const { POST } = loadTs("app/api/admin/login/route.ts", mocks);
    const response = await POST(new Request("http://localhost/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@example.test", password: "correct horse" }) }));
    assert.equal(response.status, 503);
  });
});

test("logout expires the cookie, and only for requests from this site", async () => {
  const { POST } = loadTs("app/api/admin/logout/route.ts", {});
  assert.equal((await POST(new Request("http://localhost/api/admin/logout", { method: "POST", headers: { Origin: "https://evil.test" } }))).status, 403);
  const ok = await POST(new Request("http://localhost/api/admin/logout", { method: "POST", headers: { Origin: "http://localhost" } }));
  assert.equal(ok.status, 200);
  assert.ok(ok.headers.get("set-cookie").includes("Max-Age=0"));
});

test("registration listing continues beyond a capped database response", async () => {
  const ranges = [];
  const record = { id: "1", name: "Test", team_code: "CTC-1", ctfd_password: "secret", ctfd_team_id: null, ctfd_synced_at: null, created_at: team.createdAt, team_members: [] };
  const query = {
    select() { return this; }, order() { return this; },
    range(start, end) { ranges.push([start, end]); return this; },
    async overrideTypes() { return { data: ranges.length <= 2 ? [record] : [], error: null }; },
  };
  const { listRegistrations } = loadTs("lib/admin/registrations.ts", {
    "@/lib/supabase/admin": { getSupabaseAdmin: () => ({ from: () => query }) },
  });
  assert.equal((await listRegistrations()).length, 2);
  assert.deepEqual(ranges.map(([start]) => start), [0, 1, 2]);
});
