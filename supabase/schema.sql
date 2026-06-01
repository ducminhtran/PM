-- =====================================================================
-- Jira-style PM Tool — Supabase Schema
-- =====================================================================
-- Design principles:
--   1. Relations are ALWAYS UUID foreign keys. Never store names/text as
--      relation keys. The UI resolves IDs -> labels at render time.
--   2. Enums for fixed vocabularies (status, priority) so the DB enforces
--      valid values instead of trusting the client.
--   3. RLS: single internal org. Any authenticated member can read/write.
--      Tighten later by adding role checks without touching app code.
--   4. updated_at maintained by trigger, not the client (single source of truth).
-- =====================================================================

-- Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- =====================================================================
-- ENUM TYPES (fixed vocabularies — enforced at DB level)
-- =====================================================================
do $$ begin
  create type project_status as enum ('planning', 'active', 'on_hold', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'in_review', 'done', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_status as enum ('open', 'in_progress', 'resolved', 'closed', 'reopened');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_type as enum ('bug', 'improvement', 'task', 'incident');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- updated_at trigger (shared by all tables)
-- =====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- USERS (members) — mirrors auth.users, holds profile/display data.
-- We never join names into other tables; we store user_id and resolve here.
-- =====================================================================
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique references auth.users(id) on delete set null,
  full_name   text not null,
  email       text unique not null,
  avatar_url  text,
  role        text not null default 'member',   -- 'admin' | 'member'
  capacity_hours_per_week numeric(5,1) not null default 40,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_members_updated before update on public.members
  for each row execute function set_updated_at();

-- =====================================================================
-- PROJECTS
-- =====================================================================
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,              -- short code e.g. "ATL", used in task keys
  name        text not null,
  description text,
  status      project_status not null default 'planning',
  lead_id     uuid references public.members(id) on delete set null,  -- relation by ID only
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_projects_updated before update on public.projects
  for each row execute function set_updated_at();
create index if not exists idx_projects_lead on public.projects(lead_id);
create index if not exists idx_projects_status on public.projects(status);

-- =====================================================================
-- TASKS  (belong to a project, optionally assigned to a member)
-- =====================================================================
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  title          text not null,
  description    text,
  status         task_status not null default 'todo',
  priority       priority_level not null default 'medium',
  assignee_id    uuid references public.members(id) on delete set null,
  reporter_id    uuid references public.members(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete set null,  -- subtasks
  progress       smallint not null default 0 check (progress between 0 and 100),
  estimate_hours numeric(6,1),
  due_date       date,
  position       integer not null default 0,      -- ordering within a board column
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function set_updated_at();
create index if not exists idx_tasks_project  on public.tasks(project_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_status   on public.tasks(status);
create index if not exists idx_tasks_parent   on public.tasks(parent_task_id);

-- =====================================================================
-- ISSUES  (belong to a project, optionally linked to a task)
-- =====================================================================
create table if not exists public.issues (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  task_id      uuid references public.tasks(id) on delete set null,   -- optional link
  title        text not null,
  description  text,
  type         issue_type not null default 'bug',
  status       issue_status not null default 'open',
  priority     priority_level not null default 'medium',
  assignee_id  uuid references public.members(id) on delete set null,
  reporter_id  uuid references public.members(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_issues_updated before update on public.issues
  for each row execute function set_updated_at();
create index if not exists idx_issues_project  on public.issues(project_id);
create index if not exists idx_issues_assignee on public.issues(assignee_id);
create index if not exists idx_issues_status   on public.issues(status);

-- =====================================================================
-- RESOURCE ALLOCATIONS  (which member is allocated to which project,
-- how much, when). This is the "resource management" join table.
-- =====================================================================
create table if not exists public.allocations (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  allocation_pct  smallint not null default 100 check (allocation_pct between 0 and 100),
  start_date      date not null,
  end_date        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (member_id, project_id, start_date)
);
create trigger trg_allocations_updated before update on public.allocations
  for each row execute function set_updated_at();
create index if not exists idx_alloc_member  on public.allocations(member_id);
create index if not exists idx_alloc_project on public.allocations(project_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- Single internal org: any authenticated user is a trusted member and
-- may read/write all rows. We still gate on auth (no anonymous access).
-- To tighten later: replace `true` with role/ownership checks — app code
-- does not change.
-- =====================================================================
alter table public.members      enable row level security;
alter table public.projects     enable row level security;
alter table public.tasks        enable row level security;
alter table public.issues       enable row level security;
alter table public.allocations  enable row level security;

-- helper: is the caller an authenticated member?
create or replace function public.is_member()
returns boolean as $$
  select auth.role() = 'authenticated';
$$ language sql stable;

do $$
declare t text;
begin
  foreach t in array array['members','projects','tasks','issues','allocations'] loop
    execute format('drop policy if exists "%s_select" on public.%I;', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I;', t, t);
    execute format('drop policy if exists "%s_update" on public.%I;', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I;', t, t);
    execute format('create policy "%s_select" on public.%I for select using (public.is_member());', t, t);
    execute format('create policy "%s_insert" on public.%I for insert with check (public.is_member());', t, t);
    execute format('create policy "%s_update" on public.%I for update using (public.is_member()) with check (public.is_member());', t, t);
    execute format('create policy "%s_delete" on public.%I for delete using (public.is_member());', t, t);
  end loop;
end $$;
