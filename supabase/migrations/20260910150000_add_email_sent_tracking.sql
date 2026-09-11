-- =====================================================================
-- Add email_sent tracking to notifications table
-- =====================================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Index for finding unsent emails
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent ON notifications(email_sent) WHERE email_sent = FALSE;