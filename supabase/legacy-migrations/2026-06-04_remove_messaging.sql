-- Remove the out-of-scope messaging feature.
-- Wacca does not provide in-app chat; parties communicate via disclosed
-- contact info (利用規約 第5条). The `messages` table added in
-- 2026-05-31_dashboard_todos.sql (and its TODO #4 "チャット未読") is dropped.

DROP TABLE IF EXISTS messages CASCADE;
