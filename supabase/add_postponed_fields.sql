-- 複数日イベント用の日別延期先と延期備考を追加

-- 日別の延期先（JSONB: [{"date": "2026-04-14", "postponed_to": "2026-04-21"}, ...])
ALTER TABLE events ADD COLUMN IF NOT EXISTS postponed_dates JSONB;

-- 延期理由の備考（例: 「雨天延期」「荒天時は翌週に延期」）
ALTER TABLE events ADD COLUMN IF NOT EXISTS postponed_note VARCHAR(200);
