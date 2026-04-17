import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        const body = await request.json();
        const { notification_id, mark_all } = body;

        if (mark_all) {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user.id)
                .eq("is_read", false);

            if (error) {
                return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
            }
        } else if (notification_id) {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notification_id)
                .eq("user_id", user.id);

            if (error) {
                return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: "notification_id または mark_all が必要です" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}
