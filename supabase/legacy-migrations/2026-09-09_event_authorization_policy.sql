-- Organizer profiles are not subject to approval. Event publication is admin-only.

DROP POLICY IF EXISTS "Approved organizers can create events" ON events;

ALTER TABLE organizers
  DROP COLUMN IF EXISTS is_approved;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events
  ADD CONSTRAINT events_status_check
    CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'closed', 'ended', 'deleted'));

CREATE OR REPLACE FUNCTION enforce_event_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'Organizers can only create draft events';
    END IF;
  ELSIF OLD.status <> 'draft' OR NEW.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Organizers can only edit draft events or submit them for review';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_event_status_transition ON events;
CREATE TRIGGER enforce_event_status_transition
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION enforce_event_status_transition();

DROP POLICY IF EXISTS "Organizers can create draft events" ON events;
CREATE POLICY "Organizers can create draft events" ON events
  FOR INSERT WITH CHECK (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "Organizers can update their own events" ON events;
CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  ) WITH CHECK (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    AND status IN ('draft', 'pending')
  );

DROP POLICY IF EXISTS "Organizers can delete their own events" ON events;
