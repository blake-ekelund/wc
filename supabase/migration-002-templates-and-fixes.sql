-- Migration 002: Email templates table + column fixes
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add archived/trashed columns to contacts (if not already present)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'archived') THEN
    ALTER TABLE public.contacts ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trashed_at') THEN
    ALTER TABLE public.contacts ADD COLUMN trashed_at timestamptz;
  END IF;
END $$;

-- ============================================
-- 2. Fix column types for dates stored as text
-- ============================================
-- touchpoints.date: change from date to text (we store display strings)
ALTER TABLE public.touchpoints ALTER COLUMN date TYPE text USING date::text;

-- contacts.last_contact: change from date to text
ALTER TABLE public.contacts ALTER COLUMN last_contact TYPE text USING last_contact::text;

-- ============================================
-- 3. Create email_templates table
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'follow-up' CHECK (category IN ('follow-up', 'intro', 'proposal', 'thank-you', 'check-in')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies: workspace members can read/write their own workspace templates
CREATE POLICY "email_templates_select" ON public.email_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = email_templates.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "email_templates_insert" ON public.email_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = email_templates.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "email_templates_update" ON public.email_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = email_templates.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "email_templates_delete" ON public.email_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = email_templates.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Index for fast workspace lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_workspace ON public.email_templates(workspace_id);
