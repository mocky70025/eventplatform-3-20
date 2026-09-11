import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
}

export async function GET(request: NextRequest) {
    const zipcode = request.nextUrl.searchParams.get("zipcode");

    if (!zipcode || !/^\d{7}$/.test(zipcode)) {
        return NextResponse.json({ error: "正しい郵便番号を入力してください" }, { status: 400 });
    }

    // Rate limiting by IP
    const admin = createAdminClient();
    const clientIP = getClientIP(request);
    const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
        p_key: `zipcode:${clientIP}`,
        p_max_requests: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (rlError || !allowed) {
        return NextResponse.json(
            { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
            { status: 429 }
        );
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
            `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json({ error: "住所検索サービスが利用できません" }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return NextResponse.json({ error: "住所検索がタイムアウトしました" }, { status: 504 });
        }
        return NextResponse.json({ error: "住所検索中にエラーが発生しました" }, { status: 500 });
    }
}
