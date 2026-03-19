-- Migration 003: OAuth tokens for email integration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own connections
CREATE POLICY "email_connections_select" ON public.email_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_connections_insert" ON public.email_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_connections_update" ON public.email_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "email_connections_delete" ON public.email_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_email_connections_user ON public.email_connections(user_id);
