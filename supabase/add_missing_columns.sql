-- =============================================
-- 不足カラムの一括追加マイグレーション
-- =============================================

-- -----------------------------------------------
-- organizers テーブルへの追加
-- -----------------------------------------------

-- 通知設定 (notification_settings カラムは organizer 通知セクションで使用)
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS notification_settings JSONB;

-- -----------------------------------------------
-- exhibitors テーブルへの追加
-- -----------------------------------------------

-- 通知設定
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS notification_settings JSONB;

-- メディア（ギャラリー・カバー写真）
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS allow_photo_usage BOOLEAN DEFAULT TRUE;

-- 書類: 営業許可証（現在スキーマにない）
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS business_permit_image_url TEXT;

-- 書類有効期限
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS business_license_expiry DATE;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS business_permit_expiry DATE;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS pl_insurance_expiry DATE;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS vehicle_inspection_expiry DATE;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS fire_manager_expiry DATE;
