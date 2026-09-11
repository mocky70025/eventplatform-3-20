-- =====================================================================
-- Make business permit optional during onboarding
-- =====================================================================
-- Allow exhibitors to complete onboarding without business permit
-- They can add it later in profile > documents
-- Application still requires it (enforced in ApplyClient)
-- =====================================================================

ALTER TABLE exhibitors ALTER COLUMN business_permit_image_url DROP NOT NULL;
ALTER TABLE exhibitors ALTER COLUMN business_permit_expiry DROP NOT NULL;

-- Add a column to track if onboarding was completed (for UX)
-- Not strictly needed but useful for analytics
-- ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- =====================================================================
-- Note: Application flow still requires business_permit
-- Store/app/(main)/events/[id]/apply/ApplyClient.tsx lines 134-138:
--   if (!permitRegistered || !selectedDocs.includes("business_permit")) {
--     setError("応募には営業許可証の登録・選択が必要です。プロフィールで登録してください。");
--   }
-- This remains unchanged - users must add permit before applying to events.
-- =====================================================================