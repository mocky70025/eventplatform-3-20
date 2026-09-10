-- Add exhibitor list visibility setting per requirements doc
-- Controls how much info about already-applied exhibitors is shown to new applicants
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS exhibitor_list_visibility VARCHAR(10)
    DEFAULT 'all'
    CHECK (exhibitor_list_visibility IN ('all', 'category', 'none'));
