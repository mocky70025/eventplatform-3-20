-- =====================================================================
-- Eventra - 完全データベーススキーマ (ゼロから構築用)
-- Supabase SQL Editor で上から順にすべて実行してください
-- =====================================================================

-- =============================================
-- STEP 1: 既存テーブル・トリガー・関数の削除（フルリセット）
-- =============================================

DROP TRIGGER IF EXISTS update_organizers_updated_at ON organizers;
DROP TRIGGER IF EXISTS update_exhibitors_updated_at ON exhibitors;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_event_applications_updated_at ON event_applications;
DROP TRIGGER IF EXISTS update_event_reviews_updated_at ON event_reviews;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS event_reviews CASCADE;
DROP TABLE IF EXISTS event_applications CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS exhibitors CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;

-- =============================================
-- STEP 2: テーブル作成
-- =============================================

-- 主催者テーブル
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(200),
  name VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('男', '女', 'それ以外')),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  address VARCHAR(200),
  description TEXT,
  social_links JSONB,                              -- { website: "https://..." }
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 出店者テーブル
CREATE TABLE exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  shop_name VARCHAR(200),
  name VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('男', '女', 'それ以外')),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  phone_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  address VARCHAR(200),
  description TEXT,
  genre VARCHAR(50),                               -- レガシー（genres に移行予定）
  genres TEXT[],
  business_styles TEXT[],
  genre_free_text TEXT,
  business_license_image_url TEXT,
  vehicle_inspection_image_url TEXT,
  pl_insurance_image_url TEXT,
  fire_equipment_layout_image_url TEXT,
  automobile_inspection_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベントテーブル
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  event_name_furigana VARCHAR(100),
  genre VARCHAR(50) CHECK (genre IN ('フード', 'ドリンク', '物販', 'ワークショップ', '音楽', 'アート', 'スポーツ', 'その他')),
  lead_text VARCHAR(200),
  description TEXT,
  event_start_date DATE,
  event_end_date DATE,
  event_time VARCHAR(50),
  application_period_start DATE,
  application_period_end DATE,
  venue_name VARCHAR(200),
  address VARCHAR(200),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  recruit_count INTEGER,
  max_exhibitors INTEGER,
  fee VARCHAR(100),
  requirements TEXT,
  main_image_url TEXT,
  gallery_images TEXT[],
  postponed_date DATE,
  booth_content TEXT,
  venue_rules TEXT,
  venue_layout_url TEXT,
  terms_compliance TEXT,
  booth_qualification TEXT,
  privacy_policy TEXT,
  cancel_policy TEXT,
  organizer_name VARCHAR(100),
  organizer_email VARCHAR(200),
  organizer_phone VARCHAR(50),
  loading_info TEXT,
  exhibitor_form_fields JSONB,                     -- { preset: [], custom: [] }
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'closed', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベント応募テーブル
CREATE TABLE event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  form_answers JSONB,                              -- カスタムフォームの回答データ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, exhibitor_id)
);

-- イベントレビューテーブル
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
  CHECK (reviewer_id != reviewee_id)               -- 自己レビュー防止
);

-- =============================================
-- STEP 3: インデックス
-- =============================================

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

-- =============================================
-- STEP 4: updated_at 自動更新トリガー
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- =============================================
-- STEP 5: RLS有効化 + ポリシー設定
-- =============================================

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

-- ----- organizers -----
CREATE POLICY "Anyone can read organizers" ON organizers
  FOR SELECT USING (true);

CREATE POLICY "Organizers can insert their own data" ON organizers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can update their own data" ON organizers
  FOR UPDATE USING (user_id = auth.uid());

-- ----- exhibitors -----
CREATE POLICY "Anyone can read exhibitors" ON exhibitors
  FOR SELECT USING (true);

CREATE POLICY "Exhibitors can insert their own data" ON exhibitors
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Exhibitors can update their own data" ON exhibitors
  FOR UPDATE USING (user_id = auth.uid());

-- ----- events -----
CREATE POLICY "Anyone can read events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Approved organizers can create events" ON events
  FOR INSERT WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid() AND is_approved = true
    )
  );

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid() AND is_approved = true
    )
  );

CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid() AND is_approved = true
    )
  );

-- ----- event_applications -----
-- 応募者本人またはイベント主催者のみ閲覧可能
CREATE POLICY "Applicants and event organizers can read applications" ON event_applications
  FOR SELECT USING (
    exhibitor_id IN (
      SELECT id FROM exhibitors WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_applications.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Exhibitors can apply to events" ON event_applications
  FOR INSERT WITH CHECK (
    exhibitor_id IN (
      SELECT id FROM exhibitors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update applications for their events" ON event_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_applications.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Exhibitors can update their own applications" ON event_applications
  FOR UPDATE USING (
    exhibitor_id IN (
      SELECT id FROM exhibitors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitors can cancel their own applications" ON event_applications
  FOR DELETE USING (
    exhibitor_id IN (
      SELECT id FROM exhibitors WHERE user_id = auth.uid()
    )
  );

-- ----- event_reviews -----
CREATE POLICY "Anyone can read reviews" ON event_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON event_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON event_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON event_reviews
  FOR DELETE USING (reviewer_id = auth.uid());

-- =============================================
-- STEP 6: ストレージバケット + ポリシー
-- =============================================

-- バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-documents', 'exhibitor-documents', false,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif','application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images', 'event-images', true,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-documents', 'organizer-documents', false,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 既存ストレージポリシーをすべて削除（旧名・新名の両方）
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

-- exhibitor-documents
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
-- 主催者が応募者のドキュメントを閲覧できるようにする
CREATE POLICY "Allow organizer select from exhibitor-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM event_applications ea
      JOIN exhibitors e ON e.id = ea.exhibitor_id
      JOIN events ev ON ev.id = ea.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE e.user_id = (storage.foldername(name))[1]::uuid
      AND o.user_id = auth.uid()
    )
  );

-- event-images
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

-- organizer-documents
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
