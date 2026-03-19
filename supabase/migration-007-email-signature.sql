-- Migration 007: Add email_signature to profiles
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_signature') THEN
    ALTER TABLE public.profiles ADD COLUMN email_signature text NOT NULL DEFAULT '';
  END IF;
END $$;
