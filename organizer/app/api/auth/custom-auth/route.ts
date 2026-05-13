import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

async function sendConfirmationEmail(to: string, confirmUrl: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "Wacca <noreply@wacca.xyz>",
            to: [to],
            subject: "【Wacca】メールアドレスの確認",
            html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:22px;font-weight:bold;color:#0f172a">Wacca</span>
        </td></tr>
        <tr><td style="font-size:18px;font-weight:bold;color:#0f172a;padding-bottom:12px">
          メールアドレスの確認
        </td></tr>
        <tr><td style="font-size:14px;color:#475569;line-height:1.7;padding-bottom:28px">
          Waccaにご登録いただきありがとうございます。<br>
          以下のボタンをクリックして、メールアドレスを確認してください。
        </td></tr>
        <tr><td align="center" style="padding-bottom:28px">
          <a href="${confirmUrl}" style="display:inline-block;background:#f97316;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:10px">
            メールアドレスを確認する
          </a>
        </td></tr>
        <tr><td style="font-size:12px;color:#94a3b8;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px">
          このリンクは24時間有効です。心当たりのない場合はこのメールを無視してください。<br>
          ボタンが機能しない場合: ${confirmUrl}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.message ?? `status ${res.status}` };
}

const APP_PASSWORD_KEY = "organizer_password_hash";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
    const [salt, storedHash] = stored.split(":");
    if (!salt || !storedHash) return false;
    const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
    // Timing-safe comparison to prevent timing attacks
    const hashBuf = Buffer.from(hash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (hashBuf.length !== storedBuf.length) return false;
    return timingSafeEqual(hashBuf, storedBuf);
}

// Generic error message to prevent user enumeration
const AUTH_FAILED_MSG = "メールアドレスまたはパスワードが正しくありません";

export async function POST(request: Request) {
    try {
        const { action, email, password, userId } = await request.json();

        if (!email || !password || !action) {
            return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
        }

        // Validate password length
        if (password.length < 8 || password.length > 128) {
            return NextResponse.json({ error: "パスワードは8文字以上128文字以下で入力してください" }, { status: 400 });
        }

        const admin = createAdminClient();

        // Rate limiting by email (distributed via Supabase)
        const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
            p_key: `auth:${email.toLowerCase()}`,
            p_max_requests: RATE_LIMIT_MAX,
            p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        });
        if (rlError || !allowed) {
            return NextResponse.json(
                { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
                { status: 429 }
            );
        }

        if (action === "signup") {
            // Check if user already exists
            const { data: existingUserId } = await admin.rpc("get_user_id_by_email", { user_email: email });

            if (existingUserId) {
                const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(existingUserId);
                if (getUserError || !user) {
                    return NextResponse.json({ error: AUTH_FAILED_MSG }, { status: 401 });
                }

                // Try app-specific password
                const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
                if (storedHash && verifyPassword(password, storedHash)) {
                    // Update Supabase native password to match (so signInWithPassword works)
                    await admin.auth.admin.updateUserById(existingUserId, { password });
                    return NextResponse.json({ action: "login" });
                }

                // No app-specific hash — cross-app user: store password and allow login
                if (!storedHash) {
                    const passwordHash = hashPassword(password);
                    await admin.auth.admin.updateUserById(existingUserId, {
                        password,
                        app_metadata: {
                            ...user.app_metadata,
                            [APP_PASSWORD_KEY]: passwordHash,
                        },
                    });
                    return NextResponse.json({ action: "login" });
                }

                return NextResponse.json({ error: AUTH_FAILED_MSG }, { status: 401 });
            }

            // New user — create unconfirmed and send confirmation email
            const passwordHash = hashPassword(password);
            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: "signup",
                email,
                password,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
                },
            });

            if (linkError || !linkData) {
                return NextResponse.json({ error: "登録に失敗しました。しばらく後にお試しください。" }, { status: 400 });
            }

            await admin.auth.admin.updateUserById(linkData.user.id, {
                app_metadata: { [APP_PASSWORD_KEY]: passwordHash },
            });

            const sent = await sendConfirmationEmail(email, linkData.properties.action_link);
            if (!sent.ok) {
                await admin.auth.admin.deleteUser(linkData.user.id);
                return NextResponse.json({ error: `メール送信に失敗しました: ${sent.error}` }, { status: 500 });
            }

            return NextResponse.json({ action: "signup" });
        }

        if (action === "login") {
            const { data: foundUserId, error: rpcError } = await admin.rpc("get_user_id_by_email", {
                user_email: email,
            });

            if (rpcError || !foundUserId) {
                return NextResponse.json({ error: AUTH_FAILED_MSG }, { status: 401 });
            }

            const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(foundUserId);
            if (getUserError || !user) {
                return NextResponse.json({ error: AUTH_FAILED_MSG }, { status: 401 });
            }

            const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
            if (!storedHash || !verifyPassword(password, storedHash)) {
                return NextResponse.json({ error: AUTH_FAILED_MSG }, { status: 401 });
            }

            // Sync Supabase native password
            await admin.auth.admin.updateUserById(foundUserId, { password });

            return NextResponse.json({ action: "login" });
        }

        return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }
}
