-- Migration 009: File attachments for contacts, tasks, and touchpoints
-- Run this in Supabase SQL Editor

-- Attachments metadata table
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Polymorphic: attach to contact, task, or touchpoint
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  touchpoint_id uuid REFERENCES public.touchpoints(id) ON DELETE CASCADE,
  -- File info
  file_name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0, -- bytes
  file_type text NOT NULL DEFAULT '', -- MIME type
  storage_path text NOT NULL, -- path in Supabase Storage
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Ensure at least one parent is set
  CONSTRAINT attachment_has_parent CHECK (
    contact_id IS NOT NULL OR task_id IS NOT NULL OR touchpoint_id IS NOT NULL
  )
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can view/manage attachments
CREATE POLICY "attachments_select" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = attachments.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_insert" ON public.attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = attachments.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_delete" ON public.attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = attachments.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attachments_contact ON public.attachments(contact_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_touchpoint ON public.attachments(touchpoint_id);
CREATE INDEX IF NOT EXISTS idx_attachments_workspace ON public.attachments(workspace_id);

-- IMPORTANT: After running this SQL, go to Supabase Dashboard -> Storage
-- and create a bucket called "attachments" with the following settings:
--   - Public: OFF (private bucket)
--   - File size limit: 10MB
--   - Allowed MIME types: (leave empty for all types)
--
-- Then add these storage policies via the Storage UI:
-- SELECT policy: authenticated users can read files in their workspace path
-- INSERT policy: authenticated users can upload to their workspace path
-- DELETE policy: authenticated users can delete from their workspace path
