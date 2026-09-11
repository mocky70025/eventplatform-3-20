import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/std@0.168.0/dotenv/load.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  notificationId?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "\u0026")
    .replace(/</g, "\u003C")
    .replace(/>/g, "\u003E")
    .replace(/"/g, "\u0022")
    .replace(/'/g, "&#039;");
}

function baseTemplate(content: string, primaryColor: string = "#10b981"): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Noto Sans JP',sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:${primaryColor};padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Wacca</h1>
  </div>
  <div style="padding:32px;">
    ${content}
  </div>
  <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
      このメールは Wacca から自動送信されています。
    </p>
  </div>
</div>
</body>
</html>`;
}

function buildHtml(type: string, params: Record<string, string>): string {
  const safeEventName = escapeHtml(params.eventName || "")
  const safeExhibitorName = escapeHtml(params.exhibitorName || "")
  const safeOrganizerName = escapeHtml(params.organizerName || "")
  const actionUrl = params.actionUrl || ""

  switch (type) {
    case "new_application":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">新しい出店申し込みがありました</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」に <strong>${safeExhibitorName}</strong> から出店申し込みがありました。<br>
          内容を確認し、承認または却下の判断を行ってください。
        </p>
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">申し込みを確認する</a>` : ""}
      `, "#f97316")

    case "application_approved":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店が承認されました</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」への出店申請が承認されました。<br>
          イベント詳細ページから主催者の連絡先を確認し、出店準備を進めてください。
        </p>
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">通知を確認する</a>` : ""}
      `)

    case "application_rejected":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店申請の結果について</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」への出店申請は、今回は見送りとなりました。<br>
          他のイベントもぜひご検討ください。
        </p>
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">イベントを探す</a>` : ""}
      `)

    case "application_cancelled":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店申請がキャンセルされました</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」への出店申請が出店者によってキャンセルされました。
        </p>
      `)

    case "document_resubmit":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">書類の再提出を求められました</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」の主催者から、書類の再提出を求められています。<br>
          ${params.reason ? `<strong>理由:</strong> ${escapeHtml(params.reason)}<br>` : ""}
          マイページの書類一覧から対象書類を更新してください。
        </p>
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">書類を確認する</a>` : ""}
      `)

    case "review_request":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">レビューの依頼があります</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」の開催後、${params.reviewerType === "organizer" ? "主催者" : "出店者"}からレビューを依頼されています。
        </p>
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">レビューを書く</a>` : ""}
      `)

    case "event_reminder":
      const label = params.daysUntil === "1" ? "明日" : `${params.daysUntil}日後`
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">開催${label}のリマインド</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」の開催が${label}に迫っています。<br>
          ${params.targetType === "organizer" ? "出店者への最終連絡や当日の段取りをご確認ください。" : "当日の準備をご確認ください。"}
        </p>
      `, params.targetType === "organizer" ? "#f97316" : "#10b981")

    case "confirmed":
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店確定のご連絡</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          「${safeEventName}」への出店が確定しました。<br>
          当日の詳細（集合時間・場所・搬入ルート等）は後日主催者から連絡があります。
        </p>
      `)

    default:
      return baseTemplate(`
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${escapeHtml(params.subject || "通知")}</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
          ${escapeHtml(params.message || "新しい通知があります。")}
        </p>
      `)
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    const { to, subject, html: providedHtml, notificationId } = await req.json() as EmailRequest

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "to and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let html = providedHtml

    // If html not provided, build from notification type
    if (!html && notificationId) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
      const { data: notification } = await supabase
        .from("notifications")
        .select("type, title, message, related_event_id, related_application_id")
        .eq("id", notificationId)
        .single()

      if (notification) {
        // Fetch related event info
        let eventName = ""
        let organizerName = ""
        let actionUrl = ""

        if (notification.related_event_id) {
          const { data: event } = await supabase
            .from("events")
            .select("event_name, organizer_id")
            .eq("id", notification.related_event_id)
            .single()

          if (event) {
            eventName = event.event_name
            const { data: organizer } = await supabase
              .from("organizers")
              .select("company_name")
              .eq("id", event.organizer_id)
              .single()
            if (organizer) organizerName = organizer.company_name
          }
        }

        // Determine action URL based on notification type and user_type
        if (notification.type === "new_application") {
          actionUrl = `${Deno.env.get("NEXT_PUBLIC_ORGANIZER_URL") || "https://organizer.wacca.app"}/applications/${notification.related_application_id}`
        } else if (notification.type === "application_approved" || notification.type === "application_rejected") {
          actionUrl = `${Deno.env.get("NEXT_PUBLIC_STORE_URL") || "https://store.wacca.app"}/applications/${notification.related_application_id}`
        } else if (notification.type === "document_resubmit") {
          actionUrl = `${Deno.env.get("NEXT_PUBLIC_STORE_URL") || "https://store.wacca.app"}/profile#documents`
        } else if (notification.type === "review_request") {
          actionUrl = `${Deno.env.get("NEXT_PUBLIC_STORE_URL") || "https://store.wacca.app"}/applications/${notification.related_application_id}/review`
        }

        html = buildHtml(notification.type, {
          eventName,
          exhibitorName: notification.message?.match(/に(.+?)から/)?.[1] || "",
          organizerName,
          actionUrl,
          reason: params.reason,
          daysUntil: params.daysUntil,
          targetType: params.targetType,
          reviewerType: params.reviewerType,
          subject: notification.title,
          message: notification.message,
        })
      }
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Wacca <noreply@wacca.site>",
        to: [to],
        subject,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error("Resend error:", resendData)
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Mark notification as email_sent if notificationId provided
    if (notificationId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
      await supabase
        .from("notifications")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", notificationId)
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Edge function error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})