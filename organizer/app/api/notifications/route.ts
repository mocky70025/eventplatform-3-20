import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { newApplicationEmail } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const body = await request.json();
        const { user_id, user_type, type, title, message, related_event_id, related_application_id } = body;

        if (!user_id || !user_type || !type || !title || !message) {
            return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
        }

        // Validate user_type strictly
        if (user_type !== "exhibitor" && user_type !== "organizer") {
            return NextResponse.json({ error: "無効なユーザータイプです" }, { status: 400 });
        }

        const validTypes = ["new_application", "application_approved", "application_rejected", "confirmed", "remind", "reviewRequest"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: "無効な通知タイプです" }, { status: 400 });
        }

        // IDOR prevention: verify the caller has a legitimate relationship with the target
        // Organizer app sends notifications to exhibitors (when approving/rejecting applications)
        // The caller must be the organizer who owns the related event
        if (user_type === "exhibitor" && related_event_id) {
            const { data: profile } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!profile) {
                return NextResponse.json({ error: "権限がありません" }, { status: 403 });
            }
            // Verify the organizer owns this event
            const { data: event } = await supabase
                .from("events")
                .select("id")
                .eq("id", related_event_id)
                .eq("organizer_id", profile.id)
                .single();
            if (!event) {
                return NextResponse.json({ error: "権限がありません" }, { status: 403 });
            }
        } else {
            // For other notification types, only allow self-notifications
            if (user_id !== user.id) {
                return NextResponse.json({ error: "権限がありません" }, { status: 403 });
            }
        }

        const admin = createAdminClient();

        const { error: insertError } = await admin
            .from("notifications")
            .insert({
                user_id,
                user_type,
                type,
                title,
                message,
                related_event_id: related_event_id || null,
                related_application_id: related_application_id || null,
            });

        if (insertError) {
            return NextResponse.json({ error: "通知の作成に失敗しました" }, { status: 500 });
        }

        // メール送信（notification_settings.emailがtrueの場合）
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
                    const match = message.match(/に(.+?)から/);
                    const exhibitorName = escapeHtml(match?.[1] || "出店者");
                    const eventMatch = message.match(/「(.+?)」/);
                    const eventName = escapeHtml(eventMatch?.[1] || "イベント");
                    html = newApplicationEmail(exhibitorName, eventName);
                }

                if (html) {
                    await sendNotificationEmail({
                        to: profile.email,
                        subject: title,
                        html,
                    });
                }
            }
        } catch {
            // Email delivery is non-critical; swallow failures.
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
