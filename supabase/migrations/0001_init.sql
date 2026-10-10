-- ============================================================================
-- Crack The Code Extended — team registration schema
--
-- Apply with the Supabase SQL editor, or:
--   psql "$DIRECT_URL" -f supabase/migrations/0001_init.sql
-- ============================================================================

-- pgcrypto supplies gen_random_bytes(), used to generate CTFd passwords.
--
-- Supabase ships it pre-installed in the `extensions` schema; a plain
-- `create extension if not exists pgcrypto` is then a no-op that leaves it
-- there, and functions running with `search_path = public` cannot see it.
-- Install it only when genuinely missing, preferring `extensions` when that
-- schema exists, and let every function below search both.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pgcrypto') then
    if exists (select 1 from pg_namespace where nspname = 'extensions') then
      create extension pgcrypto with schema extensions;
    else
      create extension pgcrypto;
    end if;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- teams
-- ----------------------------------------------------------------------------

create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  team_code       text not null,
  name            text not null,
  -- Case/whitespace-insensitive key so "0xSchale" and "0xschale " collide.
  name_key        text not null,
  -- CTFd team password, generated on insert by register_team(). The CTFd team
  -- name is the team name itself.
  ctfd_password   text not null,
  agreed_to_rules boolean not null default false,
  created_at      timestamptz not null default now(),

  constraint teams_code_unique unique (team_code),
  constraint teams_name_unique unique (name_key),
  constraint teams_name_length check (char_length(btrim(name)) between 3 and 32),
  constraint teams_must_agree check (agreed_to_rules)
);

-- ----------------------------------------------------------------------------
-- team_members
--
-- `position` is 0 for the captain, then 1..3 for the rest of the squad.
-- ----------------------------------------------------------------------------

create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams (id) on delete cascade,
  position      smallint not null,
  alias         text not null,
  first_name    text not null,
  last_name     text not null,
  student_id    text not null,
  email         text not null,
  -- CTFd platform credentials, generated on insert by register_team().
  -- Username is "<Team Name> | <Alias>"; password is an 8-character mix of
  -- lower case, upper case and digits.
  ctfd_username text not null,
  ctfd_password text not null,
  created_at    timestamptz not null default now(),

  -- One registration per person, across every team.
  constraint team_members_email_unique unique (email),
  constraint team_members_student_id_unique unique (student_id),
  constraint team_members_ctfd_username_unique unique (ctfd_username),
  constraint team_members_position_unique unique (team_id, position),
  constraint team_members_position_range check (position between 0 and 3),
  constraint team_members_email_domain check (email ~* '^[^\s@]+@([a-z0-9-]+\.)*umindanao\.edu\.ph$'),
  constraint team_members_email_lowercase check (email = lower(email)),
  constraint team_members_student_id_format check (student_id ~ '^[A-Z0-9][A-Z0-9-]{3,23}$'),
  constraint team_members_names_present check (
    btrim(alias) <> '' and btrim(first_name) <> '' and btrim(last_name) <> ''
  )
);

create index if not exists team_members_team_id_idx on public.team_members (team_id);

-- Aliases must be distinct within a squad, otherwise two members would derive
-- the same "<Team Name> | <Alias>" CTFd login.
create unique index if not exists team_members_team_alias_unique
  on public.team_members (team_id, lower(alias));

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Both tables are locked down with no policies. Registrations are written by
-- the Next.js server action using the secret key, which bypasses RLS; the
-- browser never talks to these tables directly. Add policies here if you later
-- expose a scoreboard or a signed-in participant view.
-- ----------------------------------------------------------------------------

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

revoke all on public.teams from anon, authenticated;
revoke all on public.team_members from anon, authenticated;

-- ----------------------------------------------------------------------------
-- CTFd credential generation
--
-- Passwords are built from pgcrypto's CSPRNG (gen_random_bytes), not random(),
-- because these are real platform credentials.
--
-- The alphabet omits characters that are easily confused when a password is
-- read aloud or copied off a slip of paper at the venue: l, I, 1, O, o, 0.
-- Change the three constants in generate_ctfd_password() to widen it.
-- ----------------------------------------------------------------------------

-- Uniform random integer in [1, p_max], p_max <= 256.
-- Rejection sampling keeps the distribution unbiased.
create or replace function public.random_index(p_max int)
returns int
language plpgsql
volatile
set search_path = public, extensions, pg_temp
as $$
declare
  v_limit int;
  v_byte  int;
begin
  if p_max < 1 or p_max > 256 then
    raise exception 'random_index: p_max must be between 1 and 256, got %', p_max;
  end if;

  v_limit := (256 / p_max) * p_max;

  loop
    v_byte := get_byte(gen_random_bytes(1), 0);
    exit when v_byte < v_limit;
  end loop;

  return (v_byte % p_max) + 1;
end;
$$;

-- One uniformly random character from p_set.
create or replace function public.random_char(p_set text)
returns text
language plpgsql
volatile
set search_path = public, extensions, pg_temp
as $$
begin
  return substr(p_set, public.random_index(length(p_set)), 1);
end;
$$;

-- 8-character password containing at least one lower case letter, one upper
-- case letter and one digit.
create or replace function public.generate_ctfd_password(p_length int default 8)
returns text
language plpgsql
volatile
set search_path = public, extensions, pg_temp
as $$
declare
  c_lower constant text := 'abcdefghijkmnpqrstuvwxyz';
  c_upper constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  c_digit constant text := '23456789';
  c_all   constant text := c_lower || c_upper || c_digit;
  v_chars text[];
  v_i     int;
  v_j     int;
  v_swap  text;
begin
  if p_length < 3 then
    raise exception 'generate_ctfd_password: length must be at least 3, got %', p_length;
  end if;

  -- Seed one character of each required class, then fill the remainder.
  v_chars := array[
    public.random_char(c_lower),
    public.random_char(c_upper),
    public.random_char(c_digit)
  ];

  for v_i in 4 .. p_length loop
    v_chars := v_chars || public.random_char(c_all);
  end loop;

  -- Fisher-Yates, so the seeded characters are not always in the first three
  -- positions.
  for v_i in reverse array_length(v_chars, 1) .. 2 loop
    v_j := public.random_index(v_i);
    v_swap := v_chars[v_i];
    v_chars[v_i] := v_chars[v_j];
    v_chars[v_j] := v_swap;
  end loop;

  return array_to_string(v_chars, '');
end;
$$;

-- ----------------------------------------------------------------------------
-- register_team
--
-- Inserts a team and its members in a single statement so a duplicate email on
-- the last member rolls the whole squad back instead of leaving an orphan team.
-- Unique violations propagate to the caller, which maps them to form errors.
-- ----------------------------------------------------------------------------

create or replace function public.register_team(
  p_team_name text,
  p_team_code text,
  p_members   jsonb
)
returns public.teams
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_team   public.teams;
  v_member jsonb;
  v_index  smallint := 0;
  v_name   text := btrim(p_team_name);
begin
  if jsonb_typeof(p_members) <> 'array' then
    raise exception 'p_members must be a JSON array';
  end if;

  if jsonb_array_length(p_members) not between 1 and 4 then
    raise exception 'A team must have between 1 and 4 members';
  end if;

  insert into public.teams (team_code, name, name_key, ctfd_password, agreed_to_rules)
  values (p_team_code, v_name, lower(v_name), public.generate_ctfd_password(), true)
  returning * into v_team;

  for v_member in select jsonb_array_elements(p_members)
  loop
    insert into public.team_members (
      team_id, position, alias, first_name, last_name, student_id, email,
      ctfd_username, ctfd_password
    )
    values (
      v_team.id,
      v_index,
      btrim(v_member ->> 'alias'),
      btrim(v_member ->> 'firstName'),
      btrim(v_member ->> 'lastName'),
      upper(btrim(v_member ->> 'studentId')),
      lower(btrim(v_member ->> 'email')),
      v_name || ' | ' || btrim(v_member ->> 'alias'),
      public.generate_ctfd_password()
    );

    v_index := v_index + 1;
  end loop;

  return v_team;
end;
$$;

-- Only the secret key may call these; the browser has no route to them.
revoke all on function public.register_team(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.generate_ctfd_password(int) from public, anon, authenticated;
revoke all on function public.random_char(text) from public, anon, authenticated;
revoke all on function public.random_index(int) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Self-test
--
-- Fails the migration loudly if gen_random_bytes() is not reachable from the
-- functions' search_path, rather than letting every registration fail at
-- runtime with "function gen_random_bytes(integer) does not exist".
-- ----------------------------------------------------------------------------

do $$
declare
  v_sample text;
begin
  v_sample := public.generate_ctfd_password();

  if v_sample !~ '^[A-Za-z0-9]{8}$'
     or v_sample !~ '[a-z]' or v_sample !~ '[A-Z]' or v_sample !~ '[0-9]' then
    raise exception 'generate_ctfd_password() returned an unexpected value: %', v_sample;
  end if;

  raise notice 'CTFd credential generation OK (sample password: %)', v_sample;
end;
$$;
