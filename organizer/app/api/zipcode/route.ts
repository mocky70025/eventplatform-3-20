import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const zipcode = request.nextUrl.searchParams.get("zipcode");

    if (!zipcode || !/^\d{7}$/.test(zipcode)) {
        return NextResponse.json({ error: "正しい郵便番号を入力してください" }, { status: 400 });
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
