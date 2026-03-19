-- Migration 008: Allow nullable user_id on workspace_members for pending invites
-- Run this in Supabase SQL Editor

-- Make user_id nullable for pending invites
ALTER TABLE public.workspace_members ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing unique constraint and recreate it to allow multiple nulls
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_workspace_id_user_id_key;

-- Add a partial unique index: only enforce uniqueness when user_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_workspace_user_unique
  ON public.workspace_members(workspace_id, user_id)
  WHERE user_id IS NOT NULL;

-- Add a unique index on invited_email per workspace (prevent duplicate invites)
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_workspace_email_unique
  ON public.workspace_members(workspace_id, invited_email)
  WHERE invited_email IS NOT NULL;
