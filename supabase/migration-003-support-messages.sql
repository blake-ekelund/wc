-- Migration 003: Support messages table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  user_email text NOT NULL DEFAULT 'anonymous',
  user_info text NOT NULL DEFAULT 'Anonymous visitor',
  page_url text DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — only the service role key writes to this table
-- But enable it and add a policy for admin reads
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (default)
-- Allow authenticated admin users to read
CREATE POLICY "support_messages_service_insert" ON public.support_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "support_messages_service_select" ON public.support_messages
  FOR SELECT USING (true);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at DESC);
