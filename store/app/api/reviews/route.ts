import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { event_id, reviewee_id, rating, comment } = await request.json();

    if (!event_id || !reviewee_id || !rating) {
        return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "評価は1〜5で入力してください" }, { status: 400 });
    }

    // 承認済み応募があるか確認
    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
    const exhibitor = exhibitors?.[0];

    if (!exhibitor) return NextResponse.json({ error: "出店者プロフィールが見つかりません" }, { status: 403 });

    const { data: app } = await supabase
        .from("event_applications")
        .select("id")
        .eq("event_id", event_id)
        .eq("exhibitor_id", exhibitor.id)
        .eq("status", "approved")
        .maybeSingle();

    if (!app) return NextResponse.json({ error: "承認済みの応募が見つかりません" }, { status: 403 });

    const { data, error } = await supabase
        .from("event_reviews")
        .insert({
            event_id,
            reviewer_id: user.id,
            reviewer_type: "exhibitor",
            reviewee_id,
            reviewee_type: "organizer",
            rating,
            comment: comment || null,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "このイベントへのレビューは既に送信済みです" }, { status: 409 });
        }
        return NextResponse.json({ error: "レビューの作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ review: data });
}
