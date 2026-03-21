-- Add address, website, source, and notes fields to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS billing_street1 text,
  ADD COLUMN IF NOT EXISTS billing_street2 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_state text,
  ADD COLUMN IF NOT EXISTS billing_zip text,
  ADD COLUMN IF NOT EXISTS billing_country text,
  ADD COLUMN IF NOT EXISTS shipping_street1 text,
  ADD COLUMN IF NOT EXISTS shipping_street2 text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS shipping_zip text,
  ADD COLUMN IF NOT EXISTS shipping_country text,
  ADD COLUMN IF NOT EXISTS shipping_same_as_billing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS notes text;
