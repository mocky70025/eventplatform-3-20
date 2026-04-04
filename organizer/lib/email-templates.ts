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

export function newApplicationEmail(exhibitorName: string, eventName: string): string {
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">新しい出店申し込みがありました</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${eventName}」に <strong>${exhibitorName}</strong> から出店申し込みがありました。<br>
      内容を確認し、承認または却下の判断を行ってください。
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://organizer.wacca.app"}/applications" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
      申し込みを確認する
    </a>
  `);
}

export function eventReminderEmail(eventName: string, daysUntil: number): string {
    const label = daysUntil === 1 ? "明日" : `${daysUntil}日後`;
    return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">開催${label}のリマインド</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      「${eventName}」の開催が${label}に迫っています。<br>
      出店者への最終連絡や当日の段取りをご確認ください。
    </p>
  `);
}
