-- 新しいイベントフィールドを追加するマイグレーション
-- 「固定」= 作成後に編集不可、「訂正可」= 後から編集可能

-- 延期時の仮日（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS postponed_date DATE;

-- 出店内容（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS booth_content TEXT;

-- 会場内ルール（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_rules TEXT;

-- 会場レイアウト画像URL（訂正可）
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_layout_url TEXT;

-- 出店規約
ALTER TABLE events ADD COLUMN IF NOT EXISTS terms_compliance TEXT;      -- 規約の履行（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS booth_qualification TEXT;   -- 出店資格（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS privacy_policy TEXT;        -- 肖像権・個人情報の取り扱い（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancel_policy TEXT;         -- キャンセルポリシー（固定）

-- 主催者情報
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_name VARCHAR(100);   -- 主催者名（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_email VARCHAR(200);  -- メール（固定）
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_phone VARCHAR(50);   -- 電話（固定）

-- 搬出入について（訂正可、後でOK）
ALTER TABLE events ADD COLUMN IF NOT EXISTS loading_info TEXT;

-- 出店者への質問項目（承認後に出店者へ送るフォームの設定）
-- JSON構造: { preset: string[], custom: { id: string, label: string, type: "text" | "file" }[] }
ALTER TABLE events ADD COLUMN IF NOT EXISTS exhibitor_form_fields JSONB;
