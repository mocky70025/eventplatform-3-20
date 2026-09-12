-- Avoid recursive RLS evaluation when counterparties read full profiles.
CREATE OR REPLACE FUNCTION public.organizer_can_read_applicant_exhibitor_profile(target_exhibitor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_applications AS application
    JOIN public.events AS event ON event.id = application.event_id
    JOIN public.organizers AS organizer ON organizer.id = event.organizer_id
    WHERE application.exhibitor_id = target_exhibitor_id
      AND organizer.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.exhibitor_can_read_applied_to_organizer_profile(target_organizer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_applications AS application
    JOIN public.events AS event ON event.id = application.event_id
    JOIN public.exhibitors AS exhibitor ON exhibitor.id = application.exhibitor_id
    WHERE event.organizer_id = target_organizer_id
      AND exhibitor.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.organizer_can_read_applicant_exhibitor_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exhibitor_can_read_applied_to_organizer_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organizer_can_read_applicant_exhibitor_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exhibitor_can_read_applied_to_organizer_profile(UUID) TO authenticated;

DROP POLICY IF EXISTS "Organizers can read applicant exhibitor profiles" ON exhibitors;
CREATE POLICY "Organizers can read applicant exhibitor profiles" ON exhibitors
  FOR SELECT USING (public.organizer_can_read_applicant_exhibitor_profile(id));

DROP POLICY IF EXISTS "Exhibitors can read applied-to organizer profiles" ON organizers;
CREATE POLICY "Exhibitors can read applied-to organizer profiles" ON organizers
  FOR SELECT USING (public.exhibitor_can_read_applied_to_organizer_profile(id));
