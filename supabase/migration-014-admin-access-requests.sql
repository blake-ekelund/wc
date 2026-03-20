-- Admin workspace access requests
-- Requires owner email approval before admin can view a workspace
CREATE TABLE IF NOT EXISTS admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired', 'used')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  approved_at TIMESTAMPTZ
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_admin_access_token ON admin_access_requests(token);
-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_admin_access_expires ON admin_access_requests(expires_at);

-- RLS: no public access, service role only
ALTER TABLE admin_access_requests ENABLE ROW LEVEL SECURITY;
