-- Migration 010: Demo session tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- User info (from onboarding gate)
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  -- Session tracking
  industry text DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  -- Pages/features visited
  pages_visited text[] NOT NULL DEFAULT '{}',
  features_used text[] NOT NULL DEFAULT '{}',
  -- Conversion tracking
  clicked_signup boolean NOT NULL DEFAULT false,
  clicked_signup_at timestamptz,
  converted_to_user boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  -- Session metadata
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — this is written by anonymous users and read by admins only
-- We'll use the service role key for writes and admin auth for reads
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous demo users)
CREATE POLICY "demo_sessions_insert" ON public.demo_sessions
  FOR INSERT WITH CHECK (true);

-- Anyone can update their own session (by id)
CREATE POLICY "demo_sessions_update" ON public.demo_sessions
  FOR UPDATE USING (true);

-- Only service role can read (admin panel uses service role)
-- No select policy for anon — admin reads via service role which bypasses RLS

CREATE INDEX IF NOT EXISTS idx_demo_sessions_email ON public.demo_sessions(email);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_started ON public.demo_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_converted ON public.demo_sessions(converted_to_user);
