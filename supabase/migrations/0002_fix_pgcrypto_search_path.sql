-- ============================================================================
-- Fix: "function gen_random_bytes(integer) does not exist"
--
-- The first cut of 0001 ran the credential functions with
-- `search_path = public, pg_temp`. Supabase ships pgcrypto pre-installed in
-- the `extensions` schema, so gen_random_bytes() was not reachable and every
-- registration failed at the CTFd password step.
--
-- This re-applies the four functions with `extensions` on the search_path.
-- Tables and data are untouched. Safe to run more than once, and safe to run
-- on a database that already has the corrected 0001.
--
-- Apply in the Supabase SQL editor, or:
--   psql "$DIRECT_URL" -f supabase/migrations/0002_fix_pgcrypto_search_path.sql
-- ============================================================================

-- Install pgcrypto only if it is genuinely absent, preferring the `extensions`
-- schema when it exists.
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
-- Credential generation
-- ----------------------------------------------------------------------------

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

  v_chars := array[
    public.random_char(c_lower),
    public.random_char(c_upper),
    public.random_char(c_digit)
  ];

  for v_i in 4 .. p_length loop
    v_chars := v_chars || public.random_char(c_all);
  end loop;

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
-- register_team — same body as 0001, re-applied with the corrected search_path
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

-- ----------------------------------------------------------------------------
-- Lock down and verify
-- ----------------------------------------------------------------------------

revoke all on function public.register_team(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.generate_ctfd_password(int) from public, anon, authenticated;
revoke all on function public.random_char(text) from public, anon, authenticated;
revoke all on function public.random_index(int) from public, anon, authenticated;

-- Also make sure the alias uniqueness index from the final 0001 exists, in
-- case an earlier cut of 0001 created the tables without it.
create unique index if not exists team_members_team_alias_unique
  on public.team_members (team_id, lower(alias));

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
