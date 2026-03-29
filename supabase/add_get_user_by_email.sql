-- Function to look up user ID by email (used by custom auth API routes)
-- Requires service role key to call
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;
