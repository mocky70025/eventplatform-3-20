-- Add structured event fields per requirements doc
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS target_audience JSONB,
  ADD COLUMN IF NOT EXISTS expected_visitors INTEGER,
  ADD COLUMN IF NOT EXISTS power_supply BOOLEAN,
  ADD COLUMN IF NOT EXISTS water_supply BOOLEAN,
  ADD COLUMN IF NOT EXISTS restrictions JSONB,
  ADD COLUMN IF NOT EXISTS category_slots JSONB;
