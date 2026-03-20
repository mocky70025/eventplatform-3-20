-- organizers テーブルに avatar_url カラムを追加
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- organizer-avatars ストレージバケットの作成（まだ存在しない場合）
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-avatars', 'organizer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 既存ポリシーを削除してから再作成（冪等性確保）
DROP POLICY IF EXISTS "Public read organizer avatars" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own avatar" ON storage.objects;

-- RLS ポリシー: 誰でも読める（公開）
CREATE POLICY "Public read organizer avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'organizer-avatars');

-- RLS ポリシー: 認証済みユーザーが自分のフォルダにアップロード可能
CREATE POLICY "Organizers can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS ポリシー: 自分のファイルを更新・削除可能
CREATE POLICY "Organizers can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Organizers can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'organizer-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
