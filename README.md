# Crack The Code Extended

Landing site and team registration for the University of Mindanao College of
Computing Education CTF competition. Next.js 16 (App Router) + Supabase.

## Routes

| Route       | What it is                                                   |
| ----------- | ------------------------------------------------------------ |
| `/`         | Hero, countdown, mission select, FAQ                          |
| `/register` | Team registration, writes to Supabase                         |
| `/rules`    | Competition guidelines                                        |
| `/conduct`  | Code of Conduct                                               |
| `/terms`    | Terms of Service                                              |
| `/privacy`  | Privacy Policy                                                |

Every page is statically prerendered; registration is the only dynamic path
and runs through a Server Action.

## Getting started

```bash
npm install
npm run dev
```

### 1. Supabase credentials

`.env` currently holds **placeholder** values — the project ref does not
resolve. Replace them with a real project's values from
**Project Settings → API Keys** and **→ Database**:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...          # server only, never exposed
DATABASE_URL=...                           # pooled, port 6543
DIRECT_URL=...                             # session mode, port 5432
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` are read at runtime;
the others are there for migrations and tooling. Registration fails with a
clear error until these are set.

### 2. Apply the schema

Run the migrations in order in the Supabase SQL editor, or:

```bash
psql "$DIRECT_URL" -f supabase/migrations/0001_init.sql
psql "$DIRECT_URL" -f supabase/migrations/0002_fix_pgcrypto_search_path.sql
psql "$DIRECT_URL" -f supabase/migrations/0003_ctfd_sync_state.sql
psql "$DIRECT_URL" -f supabase/migrations/0004_join_team.sql
```

`0001` creates `teams`, `team_members` and `register_team`. `0002` re-applies
the credential functions with `extensions` on their `search_path` — Supabase
pre-installs pgcrypto there, and without it every registration fails with
`function gen_random_bytes(integer) does not exist`. It is idempotent, and
harmless on a database created from the current `0001`.

`0003` adds the CTFd sync columns and `0004` adds `join_team`, which lets a
teammate join an existing squad with its team code (it locks the team row, so
a squad can never go past four members).

`0001` and `0002` end with a self-test that raises if password generation is broken, so a
successful run means credentials work.

### 3. Optional

`NEXT_PUBLIC_EVENT_START` overrides the countdown target (ISO 8601 with
offset). Defaults to `2026-10-30T09:00:00+08:00`.

### 4. Confirmation emails

Registering a team emails every member, and joining a team emails the new
member, over SMTP (`lib/email/`). Set these in `.env`:

```
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"                 # 465 = implicit TLS, 587 = STARTTLS
SMTP_USER="..."
SMTP_PASSWORD="..."             # an app password, not your account password
SMTP_FROM="Crack The Code <hello@example.com>"
SITE_URL="https://your-domain"  # absolute links in emails (the Rules button)
```

Email is best-effort: it is sent after the response, and a missing config or a
mail-server error is logged but never fails the registration. `SITE_URL` is set
explicitly because links are never built from the request's `Host` header.
The templates are in `lib/email/templates.ts`.

## How registration works

1. `components/register/register-form.tsx` holds the form state and submits
   `FormData` to a Server Action.
2. `app/register/actions.ts` rebuilds the submission and validates it with
   `lib/registration/schema.ts` (Zod).
3. `lib/registration/repository.ts` calls the `register_team` Postgres
   function, which inserts the team and all members **atomically** — a
   duplicate email on the fourth member rolls back the whole squad.
4. Unique-constraint violations are mapped back to the exact field that
   caused them, so the captain sees "this email is already registered"
   on the right row.

Rules enforced in both the schema and the database:

- Team name: 3–32 characters, unique case-insensitively
- 1–4 members, captain first
- Alias, first name, last name and student ID number required per member
- Aliases unique within a squad (they feed the CTFd username)
- Email must be `@umindanao.edu.ph` (subdomains allowed) and globally unique
- Student ID number globally unique
- Rules checkbox must be ticked

## CTFd credentials

`register_team` generates platform credentials automatically, in the same
transaction as the registration:

| Column                      | Value                                       |
| --------------------------- | ------------------------------------------- |
| `teams.ctfd_password`       | random 8 characters (CTFd team name = team name) |
| `team_members.ctfd_username`| `<Team Name> \| <Alias>`                     |
| `team_members.ctfd_password`| random 8 characters                          |

Passwords always contain at least one lower case letter, one upper case
letter and one digit. They are drawn from pgcrypto's CSPRNG
(`gen_random_bytes`), not `random()`, and the alphabet omits characters that
are misread when dictated at the venue — `l I 1 O o 0`. That gives ~46 bits
of entropy; widen it by editing the three constants in
`generate_ctfd_password()`.

**These are not shown anywhere in the UI.** The confirmation screen only
reveals the team code. Export them for distribution with:

```sql
select t.name                as team,
       t.ctfd_password       as team_password,
       m.position,
       m.ctfd_username,
       m.ctfd_password,
       m.first_name, m.last_name, m.student_id, m.email
from   public.team_members m
join   public.teams t on t.id = m.team_id
order  by t.name, m.position;
```

Passwords are stored in plain text because CTFd accounts have to be handed to
participants. Nothing but the secret key can read them — see below — but
treat the table as sensitive and avoid granting broad dashboard access.

### Security model

Row Level Security is on for both tables with **no policies**, so the
anon/publishable key cannot read or write them. All access goes through the
Server Action using `SUPABASE_SECRET_KEY`. `lib/supabase/admin.ts` imports
`server-only`, which turns an accidental client import into a build error.

## Admin API

Registration itself is a Server Action, not REST — the browser form is its
only caller. These endpoints exist for the things that genuinely need HTTP:
exporting credentials and talking to CTFd.

All of them require a bearer token:

```ini
ADMIN_API_TOKEN="..."   # openssl rand -hex 32
```

No token configured means the API is **off** (503), never open. Tokens shorter
than 24 characters are rejected, and comparison is constant-time over SHA-256
digests so neither length nor a matching prefix leaks through timing.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/teams` | All registrations as JSON. `?credentials=false` omits passwords |
| `GET` | `/api/admin/export` | CSV, one row per member, for printing credential slips |
| `POST` | `/api/admin/ctfd/sync` | Push teams and users into CTFd |

```bash
TOKEN=$(grep '^ADMIN_API_TOKEN=' .env | cut -d'"' -f2)

curl -H "Authorization: Bearer $TOKEN" localhost:3000/api/admin/teams
curl -H "Authorization: Bearer $TOKEN" -o credentials.csv localhost:3000/api/admin/export
```

The CSV escapes cells beginning `= + - @` with a leading apostrophe. Team
names and aliases are attacker-controlled text that organisers open in Excel,
and those characters would otherwise be executed as formulas.

### CTFd sync

```ini
CTFD_URL="https://ctf.example.org"
CTFD_ADMIN_TOKEN="ctfd_..."     # CTFd → Settings → Access Tokens
```

```bash
# Preview — writes nothing (this is the default)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "localhost:3000/api/admin/ctfd/sync?dryRun=true"

# Actually push
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "localhost:3000/api/admin/ctfd/sync?dryRun=false"
```

`dryRun` defaults to **true**: the endpoint writes to an external system, so
the real run has to be asked for explicitly. Credentials are checked before
anything is written, so bad config fails immediately rather than halfway
through the roster.

It is re-runnable. Rows carrying a `ctfd_team_id` / `ctfd_user_id` are
skipped; rows without one are matched against CTFd by team name and email and
**linked** rather than duplicated — which covers a previous run that created
the record but died before writing the id back. Per-row failures are
collected rather than aborting the batch, and the response is `207` when any
row failed.

> Built against the CTFd v3 admin API but **not yet exercised against a live
> CTFd instance**. Run the dry run first, then sync one team, before doing the
> whole event.

## Project layout

```
app/
  styles/          Modular CSS partials, imported by globals.css
                   (responsive.css loads last and holds every breakpoint)
  register/        Registration page + its Server Action
  api/admin/       Authenticated REST: teams, export, ctfd/sync
  rules|conduct|terms|privacy/
components/
  layout/          Header, footer, wordmark, intro curtain
  landing/         Hero, countdown, terminal, mission select, FAQ
  register/        Form, join form, rules modal, member row, squad card
  docs/            Legal document renderer
  decor/           Purely ornamental layers (sky, ticker, backdrops)
  ui/              Reveal, Halo, HexBadge
lib/
  content/         All copy: missions, FAQs, legal docs, decor data
  registration/    Schema, team codes, repository, shared types
  admin/           Bearer auth, registration queries, CSV writer
  ctfd/            CTFd API client and sync orchestration
  email/           SMTP client, confirmation email templates
  supabase/        Admin client and database types
  site.ts          Event config — dates, org names, team-size limits
supabase/migrations/
```

Copy lives in `lib/content/` rather than inside components, so updating a
rule or FAQ never means touching JSX. Design tokens are in
`app/styles/tokens.css`.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
```
