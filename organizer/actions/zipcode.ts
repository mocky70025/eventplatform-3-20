"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function lookupZipcode(zipcode: string) {
    if (!zipcode || !/^\d{7}$/.test(zipcode)) {
        return { error: "正しい郵便番号を入力してください" };
    }

    // Rate limiting
    const admin = createAdminClient();
    const { data: allowed, error: rlError } = await admin.rpc("check_rate_limit", {
        p_key: `zipcode:organizer`,
        p_max_requests: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (rlError || !allowed) {
        return { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" };
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
            return { error: "住所検索サービスが利用できません" };
        }

        const data = await res.json();
        return { data };
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return { error: "住所検索がタイムアウトしました" };
        }
        return { error: "住所検索中にエラーが発生しました" };
    }
}