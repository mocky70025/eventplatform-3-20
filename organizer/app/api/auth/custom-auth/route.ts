import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pbkdf2Sync, randomBytes } from "crypto";

const APP_PASSWORD_KEY = "organizer_password_hash";

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
            // Check if user already exists
            const { data: existingUserId } = await admin.rpc("get_user_id_by_email", { user_email: email });

            if (existingUserId) {
                const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(existingUserId);
                if (getUserError || !user) {
                    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
                }

                // Ensure email is confirmed
                if (!user.email_confirmed_at) {
                    await admin.auth.admin.updateUserById(existingUserId, { email_confirm: true });
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

                return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
            }

            // New user — create with email auto-confirmed
            const passwordHash = hashPassword(password);
            const { error: createError } = await admin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                app_metadata: {
                    [APP_PASSWORD_KEY]: passwordHash,
                },
            });

            if (createError) {
                return NextResponse.json({ error: createError.message || "登録に失敗しました" }, { status: 400 });
            }

            return NextResponse.json({ action: "signup" });
        }

        if (action === "login") {
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

            // Ensure email is confirmed
            if (!user.email_confirmed_at) {
                await admin.auth.admin.updateUserById(foundUserId, { email_confirm: true });
            }

            const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
            if (!storedHash || !verifyPassword(password, storedHash)) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
            }

            // Sync Supabase native password
            await admin.auth.admin.updateUserById(foundUserId, { password });

            return NextResponse.json({ action: "login" });
        }

        return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
    }
}
