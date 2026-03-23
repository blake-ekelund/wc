-- ============================================================
-- Vendor Management Tables
-- ============================================================

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  website TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  owner_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Contract summary (denormalized for quick filtering)
  contract_start DATE,
  contract_end DATE,
  contract_term TEXT,
  auto_renew BOOLEAN DEFAULT false,
  -- Cost
  pay_frequency TEXT,
  pay_amount NUMERIC(12,2),
  annual_amount NUMERIC(12,2),
  -- Tax
  tax_classification TEXT
);

CREATE INDEX idx_vendors_workspace ON vendors(workspace_id);
CREATE INDEX idx_vendors_status ON vendors(workspace_id, status);
CREATE INDEX idx_vendors_contract_end ON vendors(workspace_id, contract_end);

-- Vendor Contacts
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_workspace ON vendor_contacts(workspace_id);

-- Vendor Notes
CREATE TABLE IF NOT EXISTS vendor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_notes_vendor ON vendor_notes(vendor_id);
CREATE INDEX idx_vendor_notes_workspace ON vendor_notes(workspace_id);

-- Vendor Contracts (agreements, amendments, renewals, cancellations)
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'original' CHECK (type IN ('original', 'amendment', 'renewal', 'cancellation')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  start_date DATE,
  end_date DATE,
  value NUMERIC(12,2),
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_contracts_workspace ON vendor_contracts(workspace_id);
CREATE INDEX idx_vendor_contracts_end_date ON vendor_contracts(workspace_id, end_date);

-- Vendor Tax Records
CREATE TABLE IF NOT EXISTS vendor_tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  w9_status TEXT NOT NULL DEFAULT 'na' CHECK (w9_status IN ('on-file', 'requested', 'na')),
  needs_1099 BOOLEAN DEFAULT false,
  type_1099 TEXT CHECK (type_1099 IN ('1099-NEC', '1099-MISC', '1099-INT', '1099-DIV')),
  UNIQUE(vendor_id)
);

CREATE INDEX idx_vendor_tax_workspace ON vendor_tax_records(workspace_id);

-- Vendor Tax Year Records (one row per vendor per year)
CREATE TABLE IF NOT EXISTS vendor_tax_year_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-sent' CHECK (status IN ('sent', 'not-sent')),
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE(vendor_id, tax_year)
);

CREATE INDEX idx_vendor_tax_year_workspace ON vendor_tax_year_records(workspace_id);

-- ============================================================
-- RLS Policies (same pattern as existing CRM tables)
-- ============================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_tax_year_records ENABLE ROW LEVEL SECURITY;

-- Vendors
CREATE POLICY "Users can view vendors in their workspace"
  ON vendors FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can insert vendors in their workspace"
  ON vendors FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can update vendors in their workspace"
  ON vendors FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can delete vendors in their workspace"
  ON vendors FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vendor Contacts
CREATE POLICY "Users can manage vendor contacts in their workspace"
  ON vendor_contacts FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vendor Notes
CREATE POLICY "Users can manage vendor notes in their workspace"
  ON vendor_notes FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vendor Contracts
CREATE POLICY "Users can manage vendor contracts in their workspace"
  ON vendor_contracts FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vendor Tax Records
CREATE POLICY "Users can manage vendor tax records in their workspace"
  ON vendor_tax_records FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vendor Tax Year Records
CREATE POLICY "Users can manage vendor tax year records in their workspace"
  ON vendor_tax_year_records FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));
