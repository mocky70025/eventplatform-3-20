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
                let html = "";
                if (type === "new_application") {
                    // Extract exhibitor name from message
                    const match = message.match(/に(.+?)から/);
                    const exhibitorName = match?.[1] || "出店者";
                    const eventMatch = message.match(/「(.+?)」/);
                    const eventName = eventMatch?.[1] || "イベント";
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
        } catch (emailErr) {
            console.error("Email send failed:", emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notification API error:", error);
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}
