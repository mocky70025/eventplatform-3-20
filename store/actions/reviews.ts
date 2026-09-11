"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

export async function createExhibitorReview(input: {
    event_id: string;
    reviewee_id: string;
    rating: number;
    comment?: string | null;
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    // Rate limiting
    const admin = createAdminClient();
    const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
        p_key: `reviews:${user.id}`,
        p_max_requests: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (rlError || !allowed) {
        return { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" };
    }

    const { event_id, reviewee_id, rating, comment } = input;

    if (!event_id || !reviewee_id || !rating) {
        return { error: "必須項目が不足しています" };
    }
    if (rating < 1 || rating > 5) {
        return { error: "評価は1〜5で入力してください" };
    }

    // Check if user has approved application
    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
    const exhibitor = exhibitors?.[0];

    if (!exhibitor) {
        return { error: "出店者プロフィールが見つかりません" };
    }

    const { data: app } = await supabase
        .from("event_applications")
        .select("id")
        .eq("event_id", event_id)
        .eq("exhibitor_id", exhibitor.id)
        .eq("status", "approved")
        .maybeSingle();

    if (!app) {
        return { error: "承認済みの応募が見つかりません" };
    }

    const { data: reviewData, error } = await supabase
        .from("event_reviews")
        .insert({
            event_id,
            reviewer_id: user.id,
            reviewer_type: "exhibitor",
            reviewee_id,
            reviewee_type: "organizer",
            rating,
            comment: comment || null,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return { error: "このイベントへのレビューは既に送信済みです" };
        }
        return { error: "レビューの作成に失敗しました" };
    }

    revalidatePath(`/events/${event_id}`);
    return { review: reviewData };
}