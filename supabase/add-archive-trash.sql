-- Add archived and trashed_at columns to contacts
alter table public.contacts add column if not exists archived boolean not null default false;
alter table public.contacts add column if not exists trashed_at timestamptz;
