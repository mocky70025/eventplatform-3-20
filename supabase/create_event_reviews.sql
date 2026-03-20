-- ==========================================
-- Event Reviews Table
-- イベント終了後に出店者⇔主催者間で相互評価するテーブル
-- ==========================================

CREATE TABLE event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('organizer', 'exhibitor')),
  reviewee_id UUID REFERENCES auth.users(id) NOT NULL,
  reviewee_type VARCHAR(20) NOT NULL CHECK (reviewee_type IN ('organizer', 'exhibitor')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 同一イベントで同一reviewer→revieweeの重複評価を防止
  UNIQUE(event_id, reviewer_id, reviewee_id)
);

-- Enable RLS
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

-- 評価は公開読み取り可能（プロフィールに表示するため）
CREATE POLICY "Public can read event_reviews" ON event_reviews
    FOR SELECT USING (true);

-- 自分が投稿者の場合のみ作成可能
CREATE POLICY "Users can create their own reviews" ON event_reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- 自分が投稿した評価のみ更新可能
CREATE POLICY "Users can update their own reviews" ON event_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());
