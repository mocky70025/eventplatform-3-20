DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM exhibitors
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add exhibitors_user_id_key: duplicate non-null exhibitors.user_id values exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'exhibitors'::regclass
      AND conname = 'exhibitors_user_id_key'
  ) THEN
    ALTER TABLE exhibitors
      ADD CONSTRAINT exhibitors_user_id_key UNIQUE (user_id);
  END IF;
END $$;
