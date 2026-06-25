function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function baseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Noto Sans JP',sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#f97316;padding:24px 32px;">
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

export function confirmationEmail(actionLink: string): string {
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">メールアドレスの確認</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      Wacca にご登録いただきありがとうございます。<br>
      以下のボタンをクリックして、メールアドレスを確認してください。
    </p>
    <a href="${actionLink}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
      メールアドレスを確認する
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
      このメールに心当たりがない場合は、無視していただいて問題ありません。
    </p>
  `);
}

export function newApplicationEmail(exhibitorName: string, eventName: string): string {
    const safeExhibitorName = escapeHtml(exhibitorName);
    const safeEventName = escapeHtml(eventName);
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">新しい出店申し込みがありました</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${safeEventName}」に <strong>${safeExhibitorName}</strong> から出店申し込みがありました。<br>
      内容を確認し、承認または却下の判断を行ってください。
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://organizer.wacca.app"}/applications" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
      申し込みを確認する
    </a>
  `);
}

export function applicationApprovedEmail(eventName: string): string {
    const safeEventName = escapeHtml(eventName);
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店が承認されました</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${safeEventName}」への出店申請が承認されました。<br>
      イベント詳細ページから主催者の連絡先を確認し、出店準備を進めてください。
    </p>
    <a href="${process.env.NEXT_PUBLIC_STORE_URL || "https://eventra-store.vercel.app"}/notifications" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
      通知を確認する
    </a>
  `);
}

export function applicationRejectedEmail(eventName: string): string {
    const safeEventName = escapeHtml(eventName);
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">出店申請の結果について</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${safeEventName}」への出店申請は、今回は見送りとなりました。<br>
      他のイベントもぜひご検討ください。
    </p>
    <a href="${process.env.NEXT_PUBLIC_STORE_URL || "https://eventra-store.vercel.app"}/events" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
      イベントを探す
    </a>
  `);
}

export function eventReminderEmail(eventName: string, daysUntil: number): string {
    const safeEventName = escapeHtml(eventName);
    const label = daysUntil === 1 ? "明日" : `${daysUntil}日後`;
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">開催${label}のリマインド</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${safeEventName}」の開催が${label}に迫っています。<br>
      出店者への最終連絡や当日の段取りをご確認ください。
    </p>
  `);
}
