-- Add postal_code column to exhibitors and organizers tables
-- Also ensure form_answers column exists on event_applications

ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS postal_code VARCHAR(7);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(7);
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS form_answers JSONB;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
