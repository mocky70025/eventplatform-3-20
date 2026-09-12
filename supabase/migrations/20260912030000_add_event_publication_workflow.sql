ALTER TABLE events
  ALTER COLUMN event_name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

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
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'rejected' AND NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- submit_organizer_event runs as SECURITY DEFINER after validating ownership.
  IF OLD.status = 'draft' AND NEW.status = 'pending' AND current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid organizer event status transition';
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Organizers can update their own events" ON events;
CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  ) WITH CHECK (
    organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    AND status = 'draft'
  );

CREATE OR REPLACE FUNCTION public.submit_organizer_event(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row events%ROWTYPE;
BEGIN
  SELECT * INTO event_row
  FROM events
  WHERE id = p_event_id
    AND organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or access denied';
  END IF;

  IF event_row.status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft events can be submitted';
  END IF;

  IF NULLIF(BTRIM(event_row.event_name), '') IS NULL
    OR event_row.genre IS NULL
    OR NULLIF(BTRIM(event_row.description), '') IS NULL
    OR NULLIF(BTRIM(event_row.booth_content), '') IS NULL
    OR event_row.event_start_date IS NULL
    OR NULLIF(BTRIM(event_row.event_time), '') IS NULL
    OR event_row.application_period_end IS NULL
    OR NULLIF(BTRIM(event_row.venue_name), '') IS NULL
    OR NULLIF(BTRIM(event_row.address), '') IS NULL
    OR event_row.recruit_count IS NULL
    OR NULLIF(BTRIM(event_row.fee), '') IS NULL
    OR NULLIF(BTRIM(event_row.terms_compliance), '') IS NULL
    OR NULLIF(BTRIM(event_row.booth_qualification), '') IS NULL
    OR NULLIF(BTRIM(event_row.privacy_policy), '') IS NULL
    OR NULLIF(BTRIM(event_row.cancel_policy), '') IS NULL
    OR NULLIF(BTRIM(event_row.organizer_name), '') IS NULL
    OR NULLIF(BTRIM(event_row.organizer_email), '') IS NULL
    OR NULLIF(BTRIM(event_row.organizer_phone), '') IS NULL
    OR event_row.main_image_url IS NULL THEN
    RAISE EXCEPTION 'Required event information is incomplete';
  END IF;

  UPDATE events
  SET status = 'pending', submitted_at = NOW()
  WHERE id = p_event_id;

  RETURN p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_organizer_event(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_organizer_event(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
