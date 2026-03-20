-- exhibitors テーブルに avatar_url カラムを追加
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- exhibitor-avatars ストレージバケットの作成（まだ存在しない場合）
INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-avatars', 'exhibitor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 既存ポリシーを削除してから再作成（冪等性確保）
DROP POLICY IF EXISTS "Public read exhibitor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Exhibitors can delete own avatar" ON storage.objects;

-- RLS ポリシー: 誰でも読める（公開）
CREATE POLICY "Public read exhibitor avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'exhibitor-avatars');

-- RLS ポリシー: 認証済みユーザーが自分のフォルダにアップロード可能
CREATE POLICY "Exhibitors can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS ポリシー: 自分のファイルを更新・削除可能
CREATE POLICY "Exhibitors can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Exhibitors can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'exhibitor-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
