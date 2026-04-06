import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
            // Check if user already exists
            const { data: existingUserId } = await admin.rpc("get_user_id_by_email", { user_email: email });

            if (existingUserId) {
                // User exists — try to login with provided password
                const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(existingUserId);
                if (getUserError || !user) {
                    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
                }

                // Try app-specific password
                const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
                if (storedHash && verifyPassword(password, storedHash)) {
                    // Password matches — login
                    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                        type: "magiclink",
                        email,
                    });
                    if (linkError || !linkData) {
                        return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
                    }
                    return NextResponse.json({ action: "login", token_hash: linkData.properties.hashed_token });
                }

                // Try Supabase native password (sign in test)
                // If no app-specific hash, this might be a cross-app user or wrong password
                if (!storedHash) {
                    // Cross-app user: store password and login
                    const passwordHash = hashPassword(password);
                    await admin.auth.admin.updateUserById(existingUserId, {
                        app_metadata: {
                            ...user.app_metadata,
                            [APP_PASSWORD_KEY]: passwordHash,
                        },
                    });
                    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                        type: "magiclink",
                        email,
                    });
                    if (linkError || !linkData) {
                        return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
                    }
                    return NextResponse.json({ action: "login", token_hash: linkData.properties.hashed_token });
                }

                return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
            }

            // New user — create with email auto-confirmed (skip email verification)
            const passwordHash = hashPassword(password);
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
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

            // Generate magiclink token to create session
            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email,
            });

            if (linkError || !linkData) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
            }

            return NextResponse.json({
                action: "login",
                token_hash: linkData.properties.hashed_token,
            });
        }

        if (action === "cross-signup") {
            if (!userId) {
                return NextResponse.json({ error: "ユーザーIDが不足しています" }, { status: 400 });
            }

            const { data: { user }, error: getUserError } = await admin.auth.admin.getUserById(userId);
            if (getUserError || !user || user.email !== email) {
                return NextResponse.json({ error: "ユーザー認証に失敗しました" }, { status: 400 });
            }

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

            const storedHash = user.app_metadata?.[APP_PASSWORD_KEY];
            if (!storedHash || !verifyPassword(password, storedHash)) {
                return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
            }

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
