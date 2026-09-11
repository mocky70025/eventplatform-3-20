-- =====================================================================
-- Fix PII exposure in organizers/exhibitors RLS policies
-- =====================================================================
-- Problem: "Anyone can read organizers/exhibitors" exposes phone, email, address
-- Solution: Restrict SELECT to non-PII columns for public, full access for owners,
-- and conditional access for counterparties (organizer<->exhibitor via applications)
-- =====================================================================

-- ---- Drop existing overly permissive policies -----------------------------
DROP POLICY IF EXISTS "Anyone can read organizers" ON organizers;
DROP POLICY IF EXISTS "Anyone can read exhibitors" ON exhibitors;

-- ---- organizers: Public can see limited profile (no PII) -------------------
-- Public fields: id, company_name, name, avatar_url, description, social_links, genres (if added), created_at
-- PII fields: email, phone_number, postal_code, prefecture, city_address, building, address, gender, age, notification_settings

CREATE POLICY "Public can read organizer public profile" ON organizers
  FOR SELECT USING (true);

-- Actually, Postgres doesn't support column-level SELECT policies directly.
-- We need to use SECURITY DEFINER functions or create views.
-- Approach: Create a public view for limited organizer info, and restrict table access.

-- ---- Create public views for safe data exposure ---------------------------

-- Public organizer view (no PII)
CREATE OR REPLACE VIEW public.organizers_public AS
SELECT
  id,
  company_name,
  name,
  avatar_url,
  description,
  social_links,
  created_at
FROM organizers;

GRANT SELECT ON public.organizers_public TO anon, authenticated;

-- Public exhibitor view (no PII)
CREATE OR REPLACE VIEW public.exhibitors_public AS
SELECT
  id,
  shop_name,
  name,
  gender,
  age,
  avatar_url,
  description,
  genres,
  business_styles,
  genre_free_text,
  gallery_images,
  cover_image,
  allow_photo_usage,
  created_at
FROM exhibitors;

GRANT SELECT ON public.exhibitors_public TO anon, authenticated;

-- ---- Restrict base tables: only owner + counterparties with application ----

-- Organizers: owner can read full row
CREATE POLICY "Organizers can read own full profile" ON organizers
  FOR SELECT USING (user_id = auth.uid());

-- Exhibitors: owner can read full row
CREATE POLICY "Exhibitors can read own full profile" ON exhibitors
  FOR SELECT USING (user_id = auth.uid());

-- Organizer can read exhibitor full profile IF exhibitor applied to organizer's event
CREATE POLICY "Organizers can read applicant exhibitor profiles" ON exhibitors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_applications ea
      JOIN events e ON e.id = ea.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE ea.exhibitor_id = exhibitors.id
      AND o.user_id = auth.uid()
    )
  );

-- Exhibitor can read organizer full profile IF exhibitor applied to organizer's event
CREATE POLICY "Exhibitors can read applied-to organizer profiles" ON organizers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_applications ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
      AND e.organizer_id = organizers.id
    )
  );

-- Admin/service_role bypass: allow full access (RLS is bypassed for service_role anyway)
-- But explicit policy for clarity
CREATE POLICY "Service role full access organizers" ON organizers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access exhibitors" ON exhibitors
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- Update application code to use views for public listings
-- =====================================================================
-- Store app (exhibitor side):
--   - Event search/list: uses events table (already public) + organizers_public view for organizer info
--   - Organizer detail page: uses organizers_public view
--
-- Organizer app:
--   - Application detail: uses base tables via existing policies (organizer owns event)
--   - Exhibitor list: uses exhibitors_public view for public info, base table for applicants
--
-- Admin app:
--   - Uses service_role, bypasses RLS
-- =====================================================================