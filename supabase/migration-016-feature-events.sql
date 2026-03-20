-- Feature event tracking for usage analytics
CREATE TABLE IF NOT EXISTS feature_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  workspace_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by event name and time range (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_feature_events_name_created
  ON feature_events (event_name, created_at DESC);

-- Index for querying by workspace
CREATE INDEX IF NOT EXISTS idx_feature_events_workspace
  ON feature_events (workspace_id, created_at DESC)
  WHERE workspace_id IS NOT NULL;

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_feature_events_user
  ON feature_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- RLS: only service role can insert/read (no client access)
ALTER TABLE feature_events ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can access
