-- Add structured address columns to exhibitors
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS prefecture VARCHAR(10);
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS city_address VARCHAR(200);
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS building VARCHAR(200);

-- Keep postal_code for organizers (simple address)
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(7);

-- Add form_answers to event_applications
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS form_answers JSONB;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
