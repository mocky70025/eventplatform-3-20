-- 管理者操作の監査ログテーブル
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON admin_audit_logs (admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs (target_type, target_id);

-- RLS: service_role のみ挿入可能（APIルートから service_role key で書き込む）
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理者はログを閲覧可能（将来的に管理画面で表示するため）
CREATE POLICY "admin_audit_logs_select" ON admin_audit_logs
    FOR SELECT USING (true);

-- INSERT は service_role のみ（RLS はバイパスされる）
-- 一般ユーザーからの直接挿入を防止
CREATE POLICY "admin_audit_logs_no_insert" ON admin_audit_logs
    FOR INSERT WITH CHECK (false);
