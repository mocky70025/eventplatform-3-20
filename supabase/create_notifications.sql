-- =====================================================================
-- Wacca - 通知テーブル作成
-- =====================================================================

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分の通知のみ閲覧可能
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- ポリシー: 自分の通知のみ更新可能（既読にする）
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ポリシー: サービスロール（API経由）のみ挿入可能
-- ※ 通知は他ユーザーの行動で作成されるため、anon keyでの直接挿入は不可
-- API routeでadmin clientを使ってinsertする
