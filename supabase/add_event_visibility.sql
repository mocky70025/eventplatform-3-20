-- =====================================================================
-- Wacca - イベント公開設定カラム追加
-- =====================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility VARCHAR(10) DEFAULT 'public'
  CHECK (visibility IN ('public', 'private'));
