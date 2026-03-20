-- Migration 013: Page views tracking for visitor analytics
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,       -- anonymous fingerprint (hashed IP + UA)
  page TEXT NOT NULL,             -- e.g. '/', '/demo', '/pricing'
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views (visitor_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- No public access — only service role can insert/read
-- API route uses SUPABASE_SERVICE_ROLE_KEY
