-- Add structured address columns to organizers (parallel to exhibitors).
-- Existing `address` column is kept for back-compat.
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS prefecture VARCHAR(10);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS city_address VARCHAR(200);
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS building VARCHAR(200);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
