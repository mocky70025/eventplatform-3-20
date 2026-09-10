-- Dashboard TODO sources: add the tables/columns the organizer dashboard
-- TODO list needs (day-of info sharing).
-- See design/SESSION_SUMMARY.md section 4 for the detection logic.

-- ---- #5 当日情報の未共有: meeting_info_sent on events -------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS meeting_info_sent BOOLEAN DEFAULT FALSE;
