-- Migration 006: Add dashboard_kpis to workspaces
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'dashboard_kpis') THEN
    ALTER TABLE public.workspaces ADD COLUMN dashboard_kpis text[] DEFAULT '{}';
  END IF;
END $$;
