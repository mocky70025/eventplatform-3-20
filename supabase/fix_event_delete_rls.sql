-- Fix: Allow unapproved organizers to update/delete their own events
-- Previously, update/delete required is_approved = true, which blocked
-- organizers from managing events before admin approval.

-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can update their own events" ON events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON events;

-- Recreate without is_approved check
CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );
