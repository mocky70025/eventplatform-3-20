"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function createNotification(data: {
    user_id: string;
    user_type: "exhibitor" | "organizer";
    type: string;
    title: string;
    message: string;
    related_event_id?: string | null;
    related_application_id?: string | null;
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    // Rate limiting
    const admin = createAdminClient();
    const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
        p_key: `notifications:${user.id}`,
        p_max_requests: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });

    if (rlError || !allowed) {
        return { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" };
    }

    const { user_id, user_type, type, title, message, related_event_id, related_application_id } = data;

    if (!user_id || !user_type || !type || !title || !message) {
        return { error: "必須項目が不足しています" };
    }

    if (user_type !== "exhibitor" && user_type !== "organizer") {
        return { error: "無効なユーザータイプです" };
    }

    const validTypes = ["new_application", "application_approved", "application_rejected", "confirmed", "remind", "reviewRequest", "document_resubmit", "application_cancelled", "application_expired", "additional_recruit_opened"];
    if (!validTypes.includes(type)) {
        return { error: "無効な通知タイプです" };
    }

    // IDOR prevention
    if (user_type === "organizer" && related_event_id) {
        const { data: exhibitors } = await supabase
            .from("exhibitors")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);
        const exhibitor = exhibitors?.[0];
        if (!exhibitor) {
            return { error: "権限がありません" };
        }
        const { data: application } = await supabase
            .from("event_applications")
            .select("id")
            .eq("event_id", related_event_id)
            .eq("exhibitor_id", exhibitor.id)
            .limit(1);
        if (!application || application.length === 0) {
            return { error: "権限がありません" };
        }
    } else {
        if (user_id !== user.id) {
            return { error: "権限がありません" };
        }
    }

    const { data: notification, error: insertError } = await admin
        .from("notifications")
        .insert({
            user_id,
            user_type,
            type,
            title,
            message,
            related_event_id: related_event_id || null,
            related_application_id: related_application_id || null,
        })
        .select("id")
        .single();

    if (insertError || !notification) {
        return { error: "通知の作成に失敗しました" };
    }

    // Async email via edge function (fire-and-forget)
    try {
        const table = user_type === "exhibitor" ? "exhibitors" : "organizers";
        const { data: profile } = await admin
            .from(table)
            .select("email, notification_settings")
            .eq("user_id", user_id)
            .single();

        if (profile?.email && profile?.notification_settings?.email !== false) {
            let html = "";
            if (type === "new_application") {
                const { data: event } = await admin
                    .from("events")
                    .select("event_name")
                    .eq("id", related_event_id)
                    .single();
                const { data: exhibitor } = await admin
                    .from("exhibitors")
                    .select("shop_name")
                    .eq("user_id", user.id)
                    .single();
                const eventName = event?.event_name || "イベント";
                const exhibitorName = exhibitor?.shop_name || "出店者";
                html = `
<h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">新しい出店申し込みがありました</h2>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
  「${eventName}」に <strong>${exhibitorName}</strong> から出店申し込みがありました。<br>
  内容を確認し、承認または却下の判断を行ってください。
</p>
<a href="${process.env.NEXT_PUBLIC_ORGANIZER_URL || "https://organizer.wacca.app"}/applications/${notification.id}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
  申し込みを確認する
</a>
`;
            }

            if (html) {
                const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification-email`;
                fetch(EDGE_FUNCTION_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    },
                    body: JSON.stringify({
                        to: profile.email,
                        subject: title,
                        html,
                        notificationId: notification.id,
                    }),
                }).catch(() => {});
            }
        }
    } catch {
        // Swallow email errors
    }

    revalidatePath("/notifications");
    return { success: true, notificationId: notification.id };
}