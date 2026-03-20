-- Add admin_session_hash to track which admin session created the request
-- Prevents one admin from using another admin's approved access
ALTER TABLE admin_access_requests ADD COLUMN IF NOT EXISTS admin_session_hash TEXT;
