import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification-email`;

async function callEdgeFunction(payload: {
  to: string;
  subject: string;
  html: string;
  notificationId: string;
}) {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        // Rate limiting by user
        const admin = createAdminClient();
        const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
            p_key: `notifications:${user.id}`,
            p_max_requests: RATE_LIMIT_MAX,
            p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        });
        if (rlError || !allowed) {
            return NextResponse.json(
                { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
                { status: 429 }
            );
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

        const validTypes = ["new_application", "application_approved", "application_rejected", "confirmed", "remind", "reviewRequest", "document_resubmit", "application_cancelled"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: "無効な通知タイプです" }, { status: 400 });
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
            return NextResponse.json({ error: "通知の作成に失敗しました" }, { status: 500 });
        }

        // メール送信（notification_settings.emailがtrueの場合） - Edge Function経由で非同期送信
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
                    // Use the same template logic as edge function
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
                    // Fire-and-forget: don't await, let edge function handle it
                    callEdgeFunction({
                        to: profile.email,
                        subject: title,
                        html,
                        notificationId: notification.id,
                    }).catch(() => {}); // Swallow errors
                }
            }
        } catch {
            // Email delivery is non-critical; swallow failures.
        }

        return NextResponse.json({ success: true, notificationId: notification.id });
    } catch {
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}