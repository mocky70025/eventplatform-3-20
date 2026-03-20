-- =============================================
-- レートリミット用テーブルと関数
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (key)
);

-- RLSを有効化（service_roleのみアクセス）
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 一般ユーザーからのアクセスを拒否
CREATE POLICY "rate_limits_no_access" ON rate_limits
  FOR ALL USING (false);

-- アトミックなレートリミットチェック関数
-- 戻り値: true = 許可, false = 制限中
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- 既存レコードを取得（行ロック）
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- 初回リクエスト: 新規レコード作成
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (p_key, 1, v_now);
    RETURN true;
  END IF;

  IF v_now > v_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    -- ウィンドウ期限切れ: リセット
    UPDATE rate_limits
    SET count = 1, window_start = v_now
    WHERE key = p_key;
    RETURN true;
  END IF;

  IF v_count >= p_max_requests THEN
    -- 制限超過
    RETURN false;
  END IF;

  -- カウント増加
  UPDATE rate_limits
  SET count = count + 1
  WHERE key = p_key;
  RETURN true;
END;
$$;

-- 古いレコードを定期的にクリーンアップする関数（任意で pg_cron 等から呼び出し）
CREATE OR REPLACE FUNCTION cleanup_rate_limits(p_older_than_seconds INTEGER DEFAULT 300)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - (p_older_than_seconds || ' seconds')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
