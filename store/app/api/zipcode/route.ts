import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const zipcode = request.nextUrl.searchParams.get("zipcode");

    if (!zipcode || !/^\d{7}$/.test(zipcode)) {
        return NextResponse.json({ error: "正しい郵便番号を入力してください" }, { status: 400 });
    }

    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
    const data = await res.json();

    return NextResponse.json(data);
}
