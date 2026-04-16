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

    // イベントがこの主催者のものか確認
    const { data: profile } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) return NextResponse.json({ error: "主催者プロフィールが見つかりません" }, { status: 403 });

    const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("id", event_id)
        .eq("organizer_id", profile.id)
        .single();

    if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 403 });

    const { data, error } = await supabase
        .from("event_reviews")
        .insert({
            event_id,
            reviewer_id: user.id,
            reviewer_type: "organizer",
            reviewee_id,
            reviewee_type: "exhibitor",
            rating,
            comment: comment || null,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "このイベントへのレビューは既に送信済みです" }, { status: 409 });
        }
        console.error("Review creation error:", error);
        return NextResponse.json({ error: "レビューの作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ review: data });
}
