-- Remove out-of-scope payment fields.
-- Wacca is a matching platform only and does NOT handle payments / fee settlement
-- (出店料の支払いは当事者間で直接 — 利用規約 第1条）. Monetization is undecided,
-- so these columns added in 2026-05-31_dashboard_todos.sql are dropped.

ALTER TABLE event_applications
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS payment_due_date;
