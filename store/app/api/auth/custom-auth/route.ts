import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { confirmationEmail } from "@/lib/email-templates";
import { pbkdf2Sync, randomBytes } from "crypto";

const APP_PASSWORD_KEY = "store_password_hash";

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
    const [salt, storedHash] = stored.split(":");
    const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
    return storedHash === hash;
}

export async function POST(request: Request) {
    try {
        const { action, email, password, userId } = await request.json();

        if (!email || !password || !action) {
            return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
        }

        const admin = createAdminClient();

        if (action === "signup") {
            const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/auth/callback`;

            // Try to create user and generate confirmation link (does NOT send Supabase's email)
            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: "signup",
                email,
                password,
                options: { redirectTo },
            });

            if (linkError) {
                // Check if user already exists (cross-app case)
                const { data: foundUserId } = await admin.rpc("get_user_id_by_email", { user_email: email });
                if (foundUserId) {
                    return NextResponse.json({ error: "exists", userId: foundUserId }, { status: 409 });
                }
                return NextResponse.json({ error: linkError.message || "登録に失敗しました" }, { status: 400 });
            }

            // Send confirmation email via Resend
            const actionLink = linkData.properties.action_link;
            await sendNotificationEmail({
                to: email,
                subject: "Wacca - メールアドレスの確認",
                html: confirmationEmail(actionLink),
            });

            return NextResponse.json({ success: true });
        }

        if (action === "cross-signup") {
            if (!userId) {
                return NextResponse.json({ error: "ユーザーIDが不足しています" }, { status: 400 });
            }

            // Verify the userId matches the email
            const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(userId);
            if (getUserError || !user || user.email !== email) {
                return NextResponse.json({ error: "ユーザー認証に失敗しました" }, { status: 400 });
            }

            // Hash password and store in app_metadata
            const passwordHash = hashPassword(password);
            const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
                app_metadata: {
                    ...user.app_metadata,
                    [APP_PASSWORD_KEY]: passwordHash,
                },
            });

            if (updateError) {
                return NextResponse.json({ error: "パスワードの保存に失敗しました" }, { status: 500 });
            }

            // Generate magic link token to create a session (no email sent)
            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email,
            });

            if (linkError || !linkData) {
                return NextResponse.json({ error: "認証リンクの生成に失敗しました" }, { status: 500 });
            }

            return NextResponse.json({ token_hash: linkData.properties.hashed_token });
        }

        if (action === "login") {
            // Find user by email via DB function
            const { data: foundUserId, error: rpcError } = await admin.rpc("get_user_id_by_email", {
                user_email: email,
            });

            if (rpcError || !foundUserId) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
            }

            const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(foundUserId);
            if (getUserError || !user) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
            }

            // Verify against app-specific password hash
            const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
            if (!storedHash || !verifyPassword(password, storedHash)) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
            }

            // Generate magic link token
            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email,
            });

            if (linkError || !linkData) {
                return NextResponse.json({ error: "認証リンクの生成に失敗しました" }, { status: 500 });
            }

            return NextResponse.json({ token_hash: linkData.properties.hashed_token });
        }

        return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }
}
