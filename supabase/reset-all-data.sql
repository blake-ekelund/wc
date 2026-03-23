-- ============================================================
-- FULL DATA RESET — Clears all user and platform data
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Disable triggers temporarily for speed
SET session_replication_role = 'replica';

-- 1. Child tables first (foreign key dependencies)
TRUNCATE TABLE custom_field_values CASCADE;
TRUNCATE TABLE custom_fields CASCADE;
TRUNCATE TABLE touchpoints CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE pipeline_stages CASCADE;
TRUNCATE TABLE alert_settings CASCADE;
TRUNCATE TABLE email_templates CASCADE;
TRUNCATE TABLE email_connections CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE workspace_members CASCADE;

-- 2. Parent tables
TRUNCATE TABLE workspaces CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- 3. Platform / analytics tables
TRUNCATE TABLE page_views CASCADE;
TRUNCATE TABLE demo_sessions CASCADE;
TRUNCATE TABLE subscribers CASCADE;
TRUNCATE TABLE conversation_messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE support_messages CASCADE;
TRUNCATE TABLE announcements CASCADE;
TRUNCATE TABLE admin_access_requests CASCADE;
TRUNCATE TABLE feature_events CASCADE;

-- 4. Re-enable triggers
SET session_replication_role = 'origin';

-- 5. Delete all auth users
-- This removes every user from Supabase Auth
DELETE FROM auth.users;

-- Done! All data cleared. You can now sign up fresh.
