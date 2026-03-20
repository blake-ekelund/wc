-- Migration 011: Subscribers + Announcements tables
-- Run in Supabase SQL Editor

-- ============================================================
-- SUBSCRIBERS TABLE
-- Captures newsletter signups from landing page
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'newsletter-popup',
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Subscribers are inserted via service role key (API route), so no anon insert policy needed.
-- Only service role can read/write subscribers (admin panel uses service role).
-- No public access at all.

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- Admin-created announcements shown in CRM /app
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'update')),
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Announcements are read publicly (any authenticated user can see active announcements)
-- Only service role (admin API) can insert/update/delete
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT
  USING (active = true);

-- Service role bypasses RLS, so no insert/update/delete policies needed for admin.
