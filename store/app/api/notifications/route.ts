import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { applicationApprovedEmail, applicationRejectedEmail } from "@/lib/email-templates";

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

        // IDOR prevention: verify the caller has a legitimate relationship with the target
        // Store app sends notifications to organizers (when applying to events)
        // The caller must be an exhibitor with an application to the related event
        if (user_type === "organizer" && related_event_id) {
            const { data: exhibitors } = await supabase
                .from("exhibitors")
                .select("id")
                .eq("user_id", user.id)
                .limit(1);
            const exhibitor = exhibitors?.[0];
            if (!exhibitor) {
                return NextResponse.json({ error: "権限がありません" }, { status: 403 });
            }
            // Verify the exhibitor has an application for this event
            const { data: application } = await supabase
                .from("event_applications")
                .select("id")
                .eq("event_id", related_event_id)
                .eq("exhibitor_id", exhibitor.id)
                .limit(1);
            if (!application || application.length === 0) {
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
            console.error("Notification insert error:", insertError);
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
                const eventMatch = message.match(/「(.+?)」/);
                const eventName = escapeHtml(eventMatch?.[1] || "イベント");
                let html = "";

                if (type === "application_approved") {
                    html = applicationApprovedEmail(eventName);
                } else if (type === "application_rejected") {
                    html = applicationRejectedEmail(eventName);
                }

                if (html) {
                    await sendNotificationEmail({
                        to: profile.email,
                        subject: title,
                        html,
                    });
                }
            }
        } catch (emailErr) {
            console.error("Email send failed:", emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notification API error:", error);
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
