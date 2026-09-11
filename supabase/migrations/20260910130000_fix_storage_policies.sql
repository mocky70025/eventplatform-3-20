-- =====================================================================
-- Fix fragile storage policies (foldername parsing -> metadata-based)
-- =====================================================================
-- Problem: Policies use `(storage.foldername(name))[1]` which is fragile
-- Solution: Use object metadata (user_id) for access control
-- Requires: Application code to include metadata on upload (see code changes)
-- =====================================================================

-- ---- Helper function to extract user_id from object metadata ------------
CREATE OR REPLACE FUNCTION storage_object_user_id(obj storage.objects)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT (obj.metadata ->> 'user_id')::uuid;
$$;

-- ---- Drop existing fragile policies -------------------------------------
DROP POLICY IF EXISTS "Allow authenticated upload to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner select from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from exhibitor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow organizer select from exhibitor-documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated upload to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner select from organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to organizer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from organizer-documents" ON storage.objects;

DROP POLICY IF EXISTS "Exhibitors can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Organizers can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated upload to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update to event-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete from event-images" ON storage.objects;

-- ---- exhibitor-documents: Metadata-based policies -----------------------
-- Upload: Require user_id in metadata matching authenticated user
CREATE POLICY "Allow authenticated upload to exhibitor-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- Owner select: metadata user_id matches auth.uid()
CREATE POLICY "Allow owner select from exhibitor-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- Owner update/delete: same
CREATE POLICY "Allow owner update to exhibitor-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );
CREATE POLICY "Allow owner delete from exhibitor-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- Organizer select: JOIN via exhibitor user_id from metadata
CREATE POLICY "Allow organizer select from exhibitor-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exhibitor-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM event_applications ea
      JOIN exhibitors e ON e.id = ea.exhibitor_id
      JOIN events ev ON ev.id = ea.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE e.user_id = (metadata ->> 'user_id')::uuid
      AND o.user_id = auth.uid()
    )
  );

-- ---- organizer-documents: Metadata-based policies -----------------------
CREATE POLICY "Allow authenticated upload to organizer-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Allow owner select from organizer-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Allow owner update to organizer-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Allow owner delete from organizer-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organizer-documents'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- ---- exhibitor-avatars: Metadata-based policies -------------------------
CREATE POLICY "Exhibitors can upload avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Exhibitors can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Exhibitors can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- ---- organizer-avatars: Metadata-based policies -------------------------
CREATE POLICY "Organizers can upload avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organizer-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Organizers can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'organizer-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Organizers can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organizer-avatars'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- ---- event-images: Metadata-based policies ------------------------------
CREATE POLICY "Allow authenticated upload to event-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Allow owner update to event-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

CREATE POLICY "Allow owner delete from event-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND (metadata ->> 'user_id')::uuid = auth.uid()
  );

-- =====================================================================
-- NOTE: Application code must be updated to include metadata on upload:
--
-- const { error } = await supabase.storage
--   .from('exhibitor-documents')
--   .upload(path, file, {
--     metadata: { user_id: user.id }
--   });
--
-- Same for avatars and event-images.
-- =====================================================================