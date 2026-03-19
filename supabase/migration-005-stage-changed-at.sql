-- Migration 005: Add stage_changed_at to contacts for KPI tracking
-- Run this in Supabase SQL Editor

-- Add stage_changed_at column (defaults to created_at for existing contacts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'stage_changed_at') THEN
    ALTER TABLE public.contacts ADD COLUMN stage_changed_at timestamptz;
    -- Backfill existing contacts: set stage_changed_at to created_at
    UPDATE public.contacts SET stage_changed_at = created_at WHERE stage_changed_at IS NULL;
  END IF;
END $$;

-- Also add completed_at to tasks for tracking when tasks were completed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
    ALTER TABLE public.tasks ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
