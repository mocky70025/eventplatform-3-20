-- =====================================================================
-- Extend event_application status enum
-- Add: cancelled, expired, additional_recruit
-- =====================================================================

-- Drop the existing check constraint and recreate with new values
ALTER TABLE event_applications DROP CONSTRAINT IF EXISTS event_applications_status_check;

ALTER TABLE event_applications ADD CONSTRAINT event_applications_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired', 'additional_recruit'));

-- Add index for expired status queries (e.g., cron job to auto-expire)
CREATE INDEX IF NOT EXISTS idx_event_applications_status_expired ON event_applications(status) WHERE status IN ('pending', 'additional_recruit');

-- Add cancelled_at timestamp for audit trail
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Add expired_at for automatic expiration tracking
ALTER TABLE event_applications ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to allow exhibitors to cancel their own applications
-- (already exists: "Exhibitors can cancel their own applications")
-- But ensure it only works for pending/pending additional_recruit status
DROP POLICY IF EXISTS "Exhibitors can cancel their own applications" ON event_applications;
CREATE POLICY "Exhibitors can cancel their own applications" ON event_applications
  FOR DELETE USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
    AND status IN ('pending', 'additional_recruit')
  );

-- Also allow UPDATE to cancelled status (for soft cancel with reason)
CREATE POLICY "Exhibitors can cancel their own applications (soft)" ON event_applications
  FOR UPDATE USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
    AND status IN ('pending', 'additional_recruit')
  ) WITH CHECK (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE user_id = auth.uid())
    AND status IN ('pending', 'additional_recruit', 'cancelled')
  );

-- Organizers can also cancel applications for their events
CREATE POLICY "Organizers can cancel applications for their events" ON event_applications
  FOR UPDATE USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  ) WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
    AND status IN ('pending', 'approved', 'additional_recruit', 'cancelled')
  );

-- Admin can do anything
CREATE POLICY "Admin full access event_applications" ON event_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Notification types for new statuses (already in validTypes in actions)
-- 'cancelled' - when exhibitor cancels
-- 'expired' - when auto-expired by cron
-- 'additional_recruit' - when organizer reopens recruitment