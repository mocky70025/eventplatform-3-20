-- =====================================================================
-- Wacca - イベント日別スケジュールカラム追加
-- =====================================================================

-- 日別の時間設定: [{ "date": "2026-04-15", "start_time": "10:00", "end_time": "18:00" }, ...]
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_schedule JSONB;

-- 日別の出店者条件: [{ "date": "2026-04-15", "recruit_count": 10, "fee": "10,000円", "notes": "..." }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_day_settings JSONB;
