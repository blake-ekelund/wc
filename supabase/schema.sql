-- =============================================
-- WorkChores CRM — Database Schema
-- =============================================
-- Architecture:
--   User → belongs to Workspace(s) via workspace_members
--   All CRM data (contacts, tasks, touchpoints, etc.) belongs to a Workspace
--   RLS ensures users can ONLY access data in their workspace(s)
-- =============================================

-- 0. Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. PROFILES (extends Supabase auth.users)
-- =============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- 2. WORKSPACES
-- =============================================
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  industry text, -- 'b2b-sales', 'saas', 'real-estate', etc.
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- 3. WORKSPACE MEMBERS (join table: users ↔ workspaces)
-- =============================================
create type public.workspace_role as enum ('owner', 'admin', 'manager', 'member');

create table public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  owner_label text not null default 'You', -- display name for assignment
  reports_to uuid references public.workspace_members(id) on delete set null,
  invited_email text, -- for pending invites (user_id is the inviter until accepted)
  status text not null default 'active' check (status in ('active', 'pending', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

-- =============================================
-- 4. PIPELINE STAGES (per workspace)
-- =============================================
create table public.pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null,
  color text not null default 'text-blue-700',
  bg_color text not null default 'bg-blue-100',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- =============================================
-- 5. CONTACTS
-- =============================================
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  role text not null default '',
  avatar text not null default '',
  avatar_color text not null default 'bg-blue-500',
  stage text not null default 'Lead',
  value numeric(12, 2) not null default 0,
  owner_id uuid references public.workspace_members(id) on delete set null,
  owner_label text not null default 'You',
  tags text[] not null default '{}',
  last_contact date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_workspace on public.contacts(workspace_id);
create index idx_contacts_stage on public.contacts(workspace_id, stage);
create index idx_contacts_owner on public.contacts(workspace_id, owner_label);

-- =============================================
-- 6. TASKS
-- =============================================
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  description text,
  due date,
  owner_label text not null default 'You',
  owner_id uuid references public.workspace_members(id) on delete set null,
  completed boolean not null default false,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_workspace on public.tasks(workspace_id);
create index idx_tasks_contact on public.tasks(contact_id);
create index idx_tasks_due on public.tasks(workspace_id, due);

-- =============================================
-- 7. TOUCHPOINTS (activity log)
-- =============================================
create table public.touchpoints (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  type text not null default 'note' check (type in ('call', 'email', 'meeting', 'note')),
  title text not null,
  description text not null default '',
  date date not null default current_date,
  owner_label text not null default 'You',
  owner_id uuid references public.workspace_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_touchpoints_workspace on public.touchpoints(workspace_id);
create index idx_touchpoints_contact on public.touchpoints(contact_id);

-- =============================================
-- 8. CUSTOM FIELDS (workspace-level definitions)
-- =============================================
create table public.custom_fields (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'number', 'date', 'select')),
  options text[], -- for 'select' type
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_custom_fields_workspace on public.custom_fields(workspace_id);

-- =============================================
-- 9. CUSTOM FIELD VALUES (per contact)
-- =============================================
create table public.custom_field_values (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  field_id uuid not null references public.custom_fields(id) on delete cascade,
  value text not null default '',
  unique(contact_id, field_id)
);

create index idx_cfv_contact on public.custom_field_values(contact_id);

-- =============================================
-- 10. ALERT SETTINGS (per workspace)
-- =============================================
create table public.alert_settings (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid unique not null references public.workspaces(id) on delete cascade,
  stale_days int not null default 14,
  at_risk_touchpoints int not null default 1,
  high_value_threshold numeric(12, 2) not null default 10000,
  overdue_alerts boolean not null default true,
  today_alerts boolean not null default true,
  negotiation_alerts boolean not null default true,
  stale_contact_alerts boolean not null default true,
  at_risk_alerts boolean not null default true
);

-- =============================================
-- RLS POLICIES
-- =============================================
-- Core helper: check if current user is a member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable;

-- Helper: check if current user is admin/owner of a workspace
create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$ language sql security definer stable;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.touchpoints enable row level security;
alter table public.custom_fields enable row level security;
alter table public.custom_field_values enable row level security;
alter table public.alert_settings enable row level security;

-- PROFILES: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- WORKSPACES: members can view, only creator can create
create policy "Members can view their workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = created_by);

create policy "Admins can update their workspaces"
  on public.workspaces for update
  using (public.is_workspace_admin(id));

-- WORKSPACE MEMBERS: members can view team, admins can manage
create policy "Members can view workspace members"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can insert workspace members"
  on public.workspace_members for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update workspace members"
  on public.workspace_members for update
  using (public.is_workspace_admin(workspace_id));

create policy "Admins can delete workspace members"
  on public.workspace_members for delete
  using (public.is_workspace_admin(workspace_id));

-- Workspace creator can insert themselves (bootstrap)
create policy "Creator can add self as first member"
  on public.workspace_members for insert
  with check (user_id = auth.uid());

-- PIPELINE STAGES: workspace members can view, admins can manage
create policy "Members can view stages"
  on public.pipeline_stages for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can insert stages"
  on public.pipeline_stages for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update stages"
  on public.pipeline_stages for update
  using (public.is_workspace_admin(workspace_id));

create policy "Admins can delete stages"
  on public.pipeline_stages for delete
  using (public.is_workspace_admin(workspace_id));

-- CONTACTS: workspace members can CRUD
create policy "Members can view contacts"
  on public.contacts for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert contacts"
  on public.contacts for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update contacts"
  on public.contacts for update
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete contacts"
  on public.contacts for delete
  using (public.is_workspace_member(workspace_id));

-- TASKS: workspace members can CRUD
create policy "Members can view tasks"
  on public.tasks for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert tasks"
  on public.tasks for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update tasks"
  on public.tasks for update
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete tasks"
  on public.tasks for delete
  using (public.is_workspace_member(workspace_id));

-- TOUCHPOINTS: workspace members can CRUD
create policy "Members can view touchpoints"
  on public.touchpoints for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert touchpoints"
  on public.touchpoints for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update touchpoints"
  on public.touchpoints for update
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete touchpoints"
  on public.touchpoints for delete
  using (public.is_workspace_member(workspace_id));

-- CUSTOM FIELDS: members can view, admins can manage
create policy "Members can view custom fields"
  on public.custom_fields for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can insert custom fields"
  on public.custom_fields for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update custom fields"
  on public.custom_fields for update
  using (public.is_workspace_admin(workspace_id));

create policy "Admins can delete custom fields"
  on public.custom_fields for delete
  using (public.is_workspace_admin(workspace_id));

-- CUSTOM FIELD VALUES: workspace members can CRUD
create policy "Members can view custom field values"
  on public.custom_field_values for select
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert custom field values"
  on public.custom_field_values for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update custom field values"
  on public.custom_field_values for update
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete custom field values"
  on public.custom_field_values for delete
  using (public.is_workspace_member(workspace_id));

-- ALERT SETTINGS: members can view, admins can manage
create policy "Members can view alert settings"
  on public.alert_settings for select
  using (public.is_workspace_member(workspace_id));

create policy "Admins can insert alert settings"
  on public.alert_settings for insert
  with check (public.is_workspace_admin(workspace_id));

create policy "Admins can update alert settings"
  on public.alert_settings for update
  using (public.is_workspace_admin(workspace_id));

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.workspaces
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.workspace_members
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.contacts
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.tasks
  for each row execute function public.update_updated_at();
