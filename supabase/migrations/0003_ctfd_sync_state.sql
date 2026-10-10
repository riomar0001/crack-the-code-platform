-- ============================================================================
-- CTFd sync state
--
-- Records what has already been pushed into CTFd so the sync endpoint is
-- re-runnable: rows that carry a CTFd id are skipped instead of creating a
-- duplicate team or user on the platform.
--
-- Apply in the Supabase SQL editor, or:
--   psql "$DIRECT_URL" -f supabase/migrations/0003_ctfd_sync_state.sql
-- ============================================================================

alter table public.teams
  add column if not exists ctfd_team_id  integer,
  add column if not exists ctfd_synced_at timestamptz;

alter table public.team_members
  add column if not exists ctfd_user_id   integer,
  add column if not exists ctfd_synced_at timestamptz;

-- A CTFd id maps to exactly one local row.
create unique index if not exists teams_ctfd_team_id_unique
  on public.teams (ctfd_team_id)
  where ctfd_team_id is not null;

create unique index if not exists team_members_ctfd_user_id_unique
  on public.team_members (ctfd_user_id)
  where ctfd_user_id is not null;

-- Lets the sync endpoint find unsynced rows cheaply once the field fills up.
create index if not exists teams_unsynced_idx
  on public.teams (created_at)
  where ctfd_team_id is null;

create index if not exists team_members_unsynced_idx
  on public.team_members (team_id)
  where ctfd_user_id is null;
