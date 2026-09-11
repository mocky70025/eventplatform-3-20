ALTER TABLE exhibitors
  ADD COLUMN IF NOT EXISTS social_links JSONB;
