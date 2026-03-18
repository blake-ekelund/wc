-- Fix RLS policies for onboarding flow
-- Problem: User creates workspace but can't read it back or add themselves as member
-- because the policies require membership that doesn't exist yet.

-- 1. WORKSPACES: Allow creator to read their own workspace
drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
  on public.workspaces for select
  using (
    public.is_workspace_member(id)
    or created_by = auth.uid()
  );

-- 2. WORKSPACE MEMBERS: Allow user to insert themselves into a workspace they created
-- The existing "Creator can add self as first member" policy only checks user_id = auth.uid()
-- but we also need to make sure they're the workspace creator OR an admin
drop policy if exists "Admins can insert workspace members" on public.workspace_members;
drop policy if exists "Creator can add self as first member" on public.workspace_members;

create policy "Users can add themselves to workspaces they created"
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.workspaces
      where id = workspace_id
        and created_by = auth.uid()
    )
  );

create policy "Admins can insert workspace members"
  on public.workspace_members for insert
  with check (
    public.is_workspace_admin(workspace_id)
  );

-- 3. PIPELINE STAGES: Allow workspace creator to insert stages during onboarding
drop policy if exists "Admins can insert stages" on public.pipeline_stages;
create policy "Admins or creators can insert stages"
  on public.pipeline_stages for insert
  with check (
    public.is_workspace_admin(workspace_id)
    or exists (
      select 1 from public.workspaces
      where id = workspace_id
        and created_by = auth.uid()
    )
  );

-- 4. ALERT SETTINGS: Allow workspace creator to insert during onboarding
drop policy if exists "Admins can insert alert settings" on public.alert_settings;
create policy "Admins or creators can insert alert settings"
  on public.alert_settings for insert
  with check (
    public.is_workspace_admin(workspace_id)
    or exists (
      select 1 from public.workspaces
      where id = workspace_id
        and created_by = auth.uid()
    )
  );
