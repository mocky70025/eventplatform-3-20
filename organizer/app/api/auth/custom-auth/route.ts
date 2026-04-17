import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const APP_PASSWORD_KEY = "organizer_password_hash";

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }
    entry.count++;
    return true;
}

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

        // Rate limiting by email
        const rateLimitKey = `auth:${email.toLowerCase()}`;
        if (!checkRateLimit(rateLimitKey)) {
            return NextResponse.json(
                { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
                { status: 429 }
            );
        }

        const admin = createAdminClient();

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
                return NextResponse.json({ error: "登録に失敗しました。しばらく後にお試しください。" }, { status: 400 });
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
