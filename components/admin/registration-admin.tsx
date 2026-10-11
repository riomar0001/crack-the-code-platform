"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { filterTeams, isTeamSynced, registrationsCsv, teamCredentials, type AdminTeam, type SyncFilter } from "@/lib/admin/roster";

const PAGE_SIZE = 12;
const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila",
});

export function RegistrationAdmin() {
  // True while an admin session is active; guards late async results after sign-out.
  const signedIn = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const [teams, setTeams] = useState<AdminTeam[] | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  // The session cookie is checked on load, so a signed-in admin never sees the form.
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SyncFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [includePasswords, setIncludePasswords] = useState(false);

  useEffect(() => () => { activeRequest.current?.abort(); signedIn.current = false; }, []);

  // Pick up an existing session (the cookie survives a refresh).
  useEffect(() => {
    void Promise.resolve().then(() => loadTeams({ silent: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCode) document.getElementById("admin-team-title")?.focus();
  }, [selectedCode]);

  /** Clears everything held in the page. The cookie is cleared by `signOut`. */
  function resetDesk() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    signedIn.current = false;
    setTeams(null);
    setAdminEmail("");
    setSelectedCode(null);
    setShowPasswords(false);
    setIncludePasswords(false);
    setQuery("");
    setStatus("all");
    setPage(1);
    setBusy(false);
    setError("");
    setNotice("");
  }

  async function signOut() {
    resetDesk();
    try {
      // The browser attaches Origin itself, which the route checks.
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Offline: the page is already cleared; the cookie expires on its own.
    }
  }

  /** `silent` is the check on page load, where "not signed in" is not an error. */
  async function loadTeams({ silent = false }: { silent?: boolean } = {}) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/teams", {
        credentials: "same-origin",
        cache: "no-store", signal: controller.signal,
      });
      const payload = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 503) {
          resetDesk();
          if (!silent || response.status === 503) {
            setError(payload.error || "Your session has expired. Please sign in again.");
          }
          return;
        }
        throw new Error(payload.error || "Unable to load registrations. Please try again.");
      }
      signedIn.current = true;
      setAdminEmail(payload.admin ?? "");
      setTeams(payload.teams);
      setNotice(silent ? "" : "Registrations are up to date.");
    } catch (cause) {
      if (!controller.signal.aborted && !silent) {
        setError(cause instanceof Error ? cause.message : "Unable to connect. Please try again.");
      }
    } finally {
      // `resetDesk` clears the marker on a 401/503, so "null" also means ours.
      // Only a newer request (a different controller) should keep this one waiting.
      if (activeRequest.current === controller || activeRequest.current === null) {
        setBusy(false);
        setChecking(false);
      }
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Unable to sign in. Please try again.");
        setBusy(false);
        return;
      }
      // The password has done its job; do not leave it in the form.
      form.reset();
      await loadTeams();
    } catch {
      setError("Unable to connect. Please try again.");
      setBusy(false);
    }
  }

  async function copy(text: string, label: string) {
    setNotice("");
    setError("");
    try {
      await navigator.clipboard.writeText(text);
      if (signedIn.current) setNotice(`${label} copied.`);
    } catch {
      if (signedIn.current) setError("Clipboard access was blocked. Allow clipboard access in your browser, or use Export CSV.");
    }
  }

  const filtered = filterTeams(teams ?? [], query, status);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = teams?.find((team) => team.teamCode === selectedCode);
  const synced = teams?.filter(isTeamSynced).length ?? 0;

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([registrationsCsv(filtered, includePasswords)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ctc-${includePasswords ? "credentials" : "registrations"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${filtered.length} teams${includePasswords ? " with passwords" : ""}.`);
  }

  return (
    <section className="ctc-admin" aria-labelledby="admin-title">
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">ORGANISER CONSOLE / CTC EXTENDED</p>
          <h1 id="admin-title">Registration desk<span>.</span></h1>
          <p className="admin-muted">Your squads, rosters, and competition credentials in one place.</p>
        </div>
        {teams !== null && <div className="admin-session"><span className="admin-muted">{adminEmail}</span><button className="admin-button" onClick={() => void signOut()}>Sign out</button></div>}
      </div>

      {error && <p className="admin-alert" role="alert">{error}</p>}
      <p className="admin-notice" role="status" aria-live="polite">{notice}</p>

      {teams === null ? (
        <div className="admin-login">
          <div className="admin-login-mark" aria-hidden="true">[ / ]</div>
          <p className="admin-eyebrow">AUTHORISED PERSONNEL</p>
          <h2>Open the registration desk</h2>
          <p className="admin-muted">Sign in with your admin email and password to view registered teams.</p>
          {checking ? (
            <p className="admin-hint" role="status">Checking your session…</p>
          ) : (
            <form onSubmit={signIn}>
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" name="email" type="email" autoComplete="username" required disabled={busy} placeholder="you@example.com" />
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" name="password" type="password" autoComplete="current-password" required disabled={busy} placeholder="Your password" />
              <button className="admin-button admin-primary" disabled={busy} type="submit">{busy ? "Signing in…" : "Open registration desk →"}</button>
            </form>
          )}
          <p className="admin-hint">You stay signed in for about an hour, even if you refresh. Sign out when you are done on a shared computer.</p>
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <div><span>Registered teams</span><strong>{teams.length.toLocaleString()}</strong><small>Squads on the roster</small></div>
            <div><span>Participants</span><strong>{teams.reduce((sum, team) => sum + team.members.length, 0).toLocaleString()}</strong><small>Across all registered teams</small></div>
            <div><span>CTFd ready</span><strong>{synced.toLocaleString()}<em> / {teams.length}</em></strong><small>{teams.length - synced} teams awaiting full sync</small></div>
          </div>

          <div className="admin-workspace">
            <div className="admin-panel-header">
              <div><h2>Team directory</h2><p className="admin-muted">Find a squad, review its roster, or take a copy with you.</p></div>
              <button className="admin-button" disabled={busy} onClick={() => void loadTeams()}>{busy ? "Refreshing…" : "↻ Refresh"}</button>
            </div>
            <div className="admin-filters">
              <div className="admin-search"><label htmlFor="admin-search">Search registrations</label><input id="admin-search" type="search" placeholder="Team, name, email, student ID…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
              <div><label htmlFor="admin-status">CTFd status</label><select id="admin-status" value={status} onChange={(event) => { setStatus(event.target.value as SyncFilter); setPage(1); }}><option value="all">All teams</option><option value="pending">Awaiting sync</option><option value="synced">Synced</option></select></div>
            </div>
            <div className="admin-export-bar">
              <div><strong>{filtered.length} teams</strong><span className="admin-muted"> match your filters</span><label className="admin-checkbox"><input type="checkbox" checked={includePasswords} onChange={(event) => setIncludePasswords(event.target.checked)} />Include passwords in CSV</label></div>
              <div className="admin-actions"><button className="admin-button" disabled={!filtered.length} onClick={() => void copy(registrationsCsv(filtered, includePasswords).replace(/^\uFEFF/, ""), "Filtered CSV")}>Copy CSV</button><button className="admin-button admin-primary" disabled={!filtered.length} onClick={exportCsv}>↓ Export CSV</button></div>
            </div>
            <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Registered teams" aria-busy={busy}>
              <table className="admin-table">
                <thead><tr><th scope="col">Team / code</th><th scope="col">Captain</th><th scope="col">Members</th><th scope="col">CTFd</th><th scope="col">Registered (PHT)</th><th scope="col"><span className="admin-sr-only">Actions</span></th></tr></thead>
                <tbody>{visible.map((team) => {
                  const captain = team.members.find((member) => member.position === 0);
                  return <tr key={team.teamCode} className={selectedCode === team.teamCode ? "admin-selected" : undefined}>
                    <td><strong>{team.name}</strong><code>{team.teamCode}</code></td>
                    <td>{captain ? `${captain.firstName} ${captain.lastName}` : "—"}<small>{captain?.email}</small></td>
                    <td>{team.members.length} / 4</td>
                    <td><span className={`admin-status ${isTeamSynced(team) ? "admin-synced" : ""}`}>{isTeamSynced(team) ? "Synced" : "Awaiting sync"}</span></td>
                    <td className="admin-date">{dateFormat.format(new Date(team.createdAt))}</td>
                    <td><button className="admin-button admin-small" aria-label={`View ${team.name}`} aria-controls="admin-team-details" aria-expanded={selectedCode === team.teamCode} onClick={() => { setSelectedCode(team.teamCode); setShowPasswords(false); }}>View →</button></td>
                  </tr>;
                })}</tbody>
              </table>
              {!filtered.length && <div className="admin-empty"><h3>{teams.length ? "No matching registrations" : "The roster is waiting"}</h3><p>{teams.length ? "Try another search or reset your filters." : "New teams will appear here once they register. Use Refresh to check again."}</p>{teams.length > 0 && <button className="admin-button" onClick={() => { setQuery(""); setStatus("all"); setPage(1); }}>Reset filters</button>}</div>}
            </div>
            <div className="admin-pagination"><span>Page {currentPage} of {totalPages} · Export and copy include all matching teams.</span><div className="admin-actions"><button className="admin-button admin-small" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className="admin-button admin-small" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
          </div>

          {selected && <section className="admin-details" id="admin-team-details" aria-labelledby="admin-team-title">
            <div className="admin-panel-header"><div><p className="admin-eyebrow">SQUAD DETAILS</p><h2 id="admin-team-title" tabIndex={-1}>{selected.name}</h2></div><button className="admin-button" onClick={() => { setSelectedCode(null); setShowPasswords(false); }}>Close details</button></div>
            <div className="admin-team-tools"><div><span className="admin-muted">Team code</span><code>{selected.teamCode}</code></div><button className="admin-button admin-small" onClick={() => void copy(selected.teamCode, "Team code")}>Copy code</button><button className="admin-button admin-small" onClick={() => void copy(teamCredentials(selected), "Team credentials")}>Copy team credentials</button><button className="admin-button admin-small" aria-pressed={showPasswords} onClick={() => setShowPasswords(!showPasswords)}>{showPasswords ? "Hide passwords" : "Show passwords"}</button></div>
            <p className="admin-team-password">Team CTFd password: <code>{showPasswords ? selected.ctfdPassword : "••••••••"}</code></p>
            <div className="admin-members">{selected.members.map((member) => <article className="admin-member" key={member.position}>
              <div className="admin-member-heading"><span className="admin-member-number">0{member.position + 1}</span><div><h3>{member.firstName} {member.lastName}</h3><p>{member.alias} · {member.position === 0 ? "Captain" : "Member"}</p></div></div>
              <dl><div><dt>Student ID</dt><dd>{member.studentId}</dd></div><div><dt>Email</dt><dd>{member.email}</dd></div><div><dt>CTFd username</dt><dd><code>{member.ctfdUsername}</code></dd></div><div><dt>CTFd password</dt><dd><code>{showPasswords ? member.ctfdPassword : "••••••••"}</code></dd></div></dl>
              <div className="admin-actions"><button className="admin-button admin-small" onClick={() => void copy(member.email, "Email address")}>Copy email</button><button className="admin-button admin-small" onClick={() => void copy(`CTFd username: ${member.ctfdUsername}\nCTFd password: ${member.ctfdPassword}`, "Member credentials")}>Copy credentials</button></div>
            </article>)}</div>
          </section>}
        </>
      )}
    </section>
  );
}
