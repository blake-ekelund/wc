-- Migration 012: Add Stripe billing columns to workspaces
-- Run in Supabase SQL Editor

-- Add plan and Stripe columns to workspaces (if not already present)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;
