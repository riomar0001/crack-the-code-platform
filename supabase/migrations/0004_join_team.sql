-- ============================================================================
-- Join an existing team with its team code
--
-- A captain registers the squad and receives a team code; teammates later add
-- themselves with that code. Like register_team, this is a security-definer
-- function only the secret key can call, and it generates the member's CTFd
-- credentials the same way.
--
-- Errors the application maps to form messages (custom SQLSTATEs):
--   CTC01  no team has that code
--   CTC02  the team already has its maximum of 4 members
-- Unique violations (email, student ID, alias) propagate as usual.
--
-- Apply in the Supabase SQL editor, or:
--   psql "$DIRECT_URL" -f supabase/migrations/0004_join_team.sql
-- ============================================================================

create or replace function public.join_team(
  p_team_code text,
  p_member    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_team     public.teams;
  v_position smallint;
  v_alias    text := btrim(p_member ->> 'alias');
begin
  if jsonb_typeof(p_member) <> 'object' then
    raise exception 'p_member must be a JSON object';
  end if;

  -- Lock the team row for the rest of the transaction, so two people joining
  -- at the same moment cannot both take the last slot.
  select * into v_team
  from public.teams
  where team_code = upper(btrim(p_team_code))
  for update;

  if not found then
    raise exception 'No team has that code' using errcode = 'CTC01';
  end if;

  -- Lowest free slot (0 is the captain, so a joiner normally lands on 1..3).
  select min(slot) into v_position
  from generate_series(0, 3) as slot
  where not exists (
    select 1
    from public.team_members m
    where m.team_id = v_team.id and m.position = slot
  );

  if v_position is null then
    raise exception 'That team is full' using errcode = 'CTC02';
  end if;

  insert into public.team_members (
    team_id, position, alias, first_name, last_name, student_id, email,
    ctfd_username, ctfd_password
  )
  values (
    v_team.id,
    v_position,
    v_alias,
    btrim(p_member ->> 'firstName'),
    btrim(p_member ->> 'lastName'),
    upper(btrim(p_member ->> 'studentId')),
    lower(btrim(p_member ->> 'email')),
    v_team.name || ' | ' || v_alias,
    public.generate_ctfd_password()
  );

  return jsonb_build_object(
    'teamName', v_team.name,
    'roster', (
      select jsonb_agg(m.alias order by m.position)
      from public.team_members m
      where m.team_id = v_team.id
    )
  );
end;
$$;

revoke all on function public.join_team(text, jsonb) from public, anon, authenticated;
