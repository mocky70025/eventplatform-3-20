-- =====================================================================
-- Wacca - Complete Database Schema (Single Source of Truth)
-- Run this entire file on a fresh Supabase project to provision the DB.
-- Sections are idempotent where possible (DROP IF EXISTS / ON CONFLICT).
-- =====================================================================

-- =====================================================================
-- STEP 1: Drop existing objects (full reset)
-- =====================================================================

DROP TRIGGER IF EXISTS update_organizers_updated_at ON organizers;
DROP TRIGGER IF EXISTS update_exhibitors_updated_at ON exhibitors;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_event_applications_updated_at ON event_applications;
DROP TRIGGER IF EXISTS update_event_reviews_updated_at ON event_reviews;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_user_id_by_email(TEXT);
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS cleanup_rate_limits(INTEGER);

DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_reviews CASCADE;
DROP TABLE IF EXISTS event_applications CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS exhibitors CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;

-- =====================================================================
-- STEP 2: Core tables
-- =====================================================================

-- ---- organizers ---------------------------------------------------------
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(200),
  name VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('男', '女', 'それ以外')),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  -- Address (structured)
  postal_code VARCHAR(7),
  prefecture VARCHAR(10),
  city_address VARCHAR(200),
  building VARCHAR(200),
  address VARCHAR(200),                            -- legacy concatenated address (kept for back-compat)
  description TEXT,
  avatar_url TEXT,
  social_links JSONB,                              -- { website: "https://..." }
  notification_settings JSONB,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- exhibitors ---------------------------------------------------------
CREATE TABLE exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  shop_name VARCHAR(200),
  name VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('男', '女', 'それ以外')),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  -- Address (structured)
  postal_code VARCHAR(7),
  prefecture VARCHAR(10),
  city_address VARCHAR(200),
  building VARCHAR(200),
  address VARCHAR(200),                            -- legacy concatenated address (kept for back-compat)
  description TEXT,
  avatar_url TEXT,
  -- Business categorization
  genre VARCHAR(50),                               -- legacy (migrating to genres[])
  genres TEXT[],
  business_styles TEXT[],
  genre_free_text TEXT,
  -- Documents and their expiries
  business_license_image_url TEXT,
  business_permit_image_url TEXT,
  vehicle_inspection_image_url TEXT,
  pl_insurance_image_url TEXT,
  fire_equipment_layout_image_url TEXT,
  automobile_inspection_image_url TEXT,
  business_license_expiry DATE,
  business_permit_expiry DATE,
  pl_insurance_expiry DATE,
  vehicle_inspection_expiry DATE,
  fire_manager_expiry DATE,
  -- Media / gallery
  gallery_images TEXT[],
  cover_image TEXT,
  allow_photo_usage BOOLEAN DEFAULT TRUE,
  -- Preferences
  notification_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- events -------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  event_name_furigana VARCHAR(100),
  genre VARCHAR(50) CHECK (genre IN ('音楽フェス', 'ライブ', 'マルシェ', 'フリーマーケット', '地域おこし', '祭り', '食フェス', 'グルメイベント', 'スポーツ', 'アウトドア', '企業', '展示会', 'その他')),
  lead_text VARCHAR(200),
  description TEXT,
  -- Schedule
  event_start_date DATE,
  event_end_date DATE,
  event_time VARCHAR(50),
  event_schedule JSONB,                            -- [{ "date": "2026-04-15", "start_time": "10:00", "end_time": "18:00" }, ...]
  event_day_settings JSONB,                        -- [{ "date": "2026-04-15", "recruit_count": 10, "fee": "10,000円", "notes": "..." }, ...]
  application_period_start DATE,
  application_period_end DATE,
  -- Postponement
  postponed_date DATE,                             -- legacy single date
  postponed_dates JSONB,                           -- [{ "date": "2026-04-14", "postponed_to": "2026-04-21" }, ...]
  postponed_note VARCHAR(200),
  -- Venue
  venue_name VARCHAR(200),
  address VARCHAR(200),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  venue_layout_url TEXT,
  venue_rules TEXT,
  loading_info TEXT,
  -- Recruit
  recruit_count INTEGER,
  max_exhibitors INTEGER,
  fee VARCHAR(100),
  requirements TEXT,
  booth_content TEXT,
  booth_qualification TEXT,
  -- Images
  main_image_url TEXT,
  gallery_images TEXT[],
  -- Terms
  terms_compliance TEXT,
  privacy_policy TEXT,
  cancel_policy TEXT,
  -- Organizer snapshot (denormalized at creation)
  organizer_name VARCHAR(100),
  organizer_email VARCHAR(200),
  organizer_phone VARCHAR(50),
  -- Application form
  exhibitor_form_fields JSONB,                     -- { preset: [], custom: [] }
  -- Flags
  visibility VARCHAR(10) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'closed', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- event_applications -------------------------------------------------
CREATE TABLE event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  form_answers JSONB,                              -- answers to custom form
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, exhibitor_id)
);

-- ---- event_reviews ------------------------------------------------------
CREATE TABLE event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('organizer', 'exhibitor')),
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_type VARCHAR(20) NOT NULL CHECK (reviewee_type IN ('organizer', 'exhibitor')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, reviewer_id, reviewee_id),
  CHECK (reviewer_id != reviewee_id)
);

-- ---- notifications ------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('organizer', 'exhibitor')),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES event_applications(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- rate_limits --------------------------------------------------------
CREATE TABLE rate_limits (
  key TEXT NOT NULL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---- admin_audit_logs ---------------------------------------------------
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- STEP 3: Indexes
-- =====================================================================

CREATE INDEX idx_organizers_user_id ON organizers(user_id);
CREATE INDEX idx_exhibitors_user_id ON exhibitors(user_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_genre ON events(genre);
CREATE INDEX idx_events_start_date ON events(event_start_date);
CREATE INDEX idx_event_applications_event_id ON event_applications(event_id);
CREATE INDEX idx_event_applications_exhibitor_id ON event_applications(exhibitor_id);
CREATE INDEX idx_event_applications_status ON event_applications(status);
CREATE INDEX idx_event_reviews_event_id ON event_reviews(event_id);
CREATE INDEX idx_event_reviews_reviewer_id ON event_reviews(reviewer_id);
CREATE INDEX idx_event_reviews_reviewee_id ON event_reviews(reviewee_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin_email ON admin_audit_logs(admin_email);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);

-- =====================================================================
-- STEP 4: Functions
-- =====================================================================

-- ---- updated_at auto-update ---------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- Lookup user ID by email (used by custom auth API routes) -----------
-- Requires service role key to call.
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;

-- ---- Atomic rate-limit check --------------------------------------------
-- Returns true = allowed, false = throttled.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start) VALUES (p_key, 1, v_now);
    RETURN true;
  END IF;

  IF v_now > v_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE rate_limits SET count = 1, window_start = v_now WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN true;
END;
$$;

-- ---- Cleanup old rate-limit rows ----------------------------------------
CREATE OR REPLACE FUNCTION cleanup_rate_limits(p_older_than_seconds INTEGER DEFAULT 300)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - (p_older_than_seconds || ' seconds')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================================
-- STEP 5: Triggers
-- =====================================================================

CREATE TRIGGER update_organizers_updated_at
  BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exhibitors_updated_at
  BEFORE UPDATE ON exhibitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_applications_updated_at
  BEFORE UPDATE ON event_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_reviews_updated_at
  BEFORE UPDATE ON event_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- STEP 6: Row-Level Security
-- =====================================================================

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ---- organizers ---------------------------------------------------------
CREATE POLICY "Anyone can read organizers" ON organizers
  FOR SELECT USING (true);
CREATE POLICY "Organizers can insert their own data" ON organizers
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Organizers can update their own data" ON organizers
  FOR UPDATE USING (user_id = auth.uid());

-- ---- exhibitors ---------------------------------------------------------
CREATE POLICY "Anyone can read exhibitors" ON exhibitors
  FOR SELECT USING (true);
CREATE POLICY "Exhibitors can insert their own data" ON exhibitors
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Exhibitors can update their own data" ON exhibitors
  FOR UPDATE USING (user_id = auth.uid());

-- ---- events -------------------------------------------------------------
CREATE POLICY "Anyone can read events" ON events
  FOR SELECT USING (true);
CREATE POLICY "Approved organizers can create events" ON events
  FOR INSERT WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid() AND is_approved = true
    )
  );
-- Note: update/delete intentionally do not require is_approved, so organizers
-- can manage events while awaiting admin approval.
CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  );
CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE USING (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  );

-- ---- event_applications -------------------------------------------------
-- Readable only by the applicant or the event's organizer.
CREATE POLICY "Applicants and event organizers can read applications" ON event_applications
  FOR SELECT USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
    OR event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );
CREATE POLICY "Exhibitors can apply to events" ON event_applications
  FOR INSERT WITH CHECK (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
  );
CREATE POLICY "Organizers can update applications for their events" ON event_applications
  FOR UPDATE USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );
CREATE POLICY "Exhibitors can update their own applications" ON event_applications
  FOR UPDATE USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
  );
CREATE POLICY "Exhibitors can cancel their own applications" ON event_applications
  FOR DELETE USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
  );

-- ---- event_reviews ------------------------------------------------------
CREATE POLICY "Anyone can read reviews" ON event_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON event_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON event_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON event_reviews
  FOR DELETE USING (reviewer_id = auth.uid());

-- ---- notifications ------------------------------------------------------
-- Inserts are done through API routes using the service role key.
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ---- rate_limits --------------------------------------------------------
-- Accessible only via service_role (RLS is bypassed for that role).
CREATE POLICY "rate_limits_no_access" ON rate_limits
  FOR ALL USING (false);

-- ---- admin_audit_logs ---------------------------------------------------
-- Inserts happen via service_role only; direct user inserts are blocked.
CREATE POLICY "admin_audit_logs_select" ON admin_audit_logs
  FOR SELECT USING (false);
CREATE POLICY "admin_audit_logs_no_insert" ON admin_audit_logs
  FOR INSERT WITH CHECK (false);

-- =====================================================================
-- STEP 7: Storage buckets + policies
-- =====================================================================

-- ---- Buckets ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-documents', 'exhibitor-documents', false,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif','application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-documents', 'organizer-documents', false,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif','application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images', 'event-images', true,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-avatars', 'exhibitor-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-avatars', 'organizer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ---- Drop any legacy storage policies -----------------------------------
DROP POLICY IF EXISTS "Allow public upload to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner select from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow organizer select from exhibitor-documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow public upload to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from event-images" ON storage.objects;

DROP POLICY IF EXISTS "Allow public upload to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner select from organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from organizer-documents" ON storage.objects;

DROP POLICY IF EXISTS "Public read exhibitor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Public read organizer avatars" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own avatar" ON storage.objects;

-- ---- exhibitor-documents ------------------------------------------------
CREATE POLICY "Allow authenticated upload to exhibitor-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner select from exhibitor-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner update to exhibitor-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner delete from exhibitor-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
-- Organizers can view documents of exhibitors who applied to their events.
CREATE POLICY "Allow organizer select from exhibitor-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM event_applications ea
      JOIN exhibitors e ON e.id = ea.exhibitor_id
      JOIN events ev ON ev.id = ea.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE e.user_id = (storage.foldername(objects.name))[1]::uuid
      AND o.user_id = auth.uid()
    )
  );

-- ---- event-images -------------------------------------------------------
CREATE POLICY "Allow authenticated upload to event-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow public select from event-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Allow owner update to event-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner delete from event-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- organizer-documents ------------------------------------------------
CREATE POLICY "Allow authenticated upload to organizer-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner select from organizer-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner update to organizer-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Allow owner delete from organizer-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- exhibitor-avatars (public-readable) --------------------------------
CREATE POLICY "Public read exhibitor avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'exhibitor-avatars');
CREATE POLICY "Exhibitors can upload avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Exhibitors can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Exhibitors can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---- organizer-avatars (public-readable) --------------------------------
CREATE POLICY "Public read organizer avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'organizer-avatars');
CREATE POLICY "Organizers can upload avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Organizers can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Organizers can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================================
-- Reload PostgREST schema cache
-- =====================================================================
NOTIFY pgrst, 'reload schema';
