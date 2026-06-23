import { createClient } from "@/lib/supabase/server";
import { getDashboardTodos } from "@/lib/dashboard/todos";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!organizer) {
      return NextResponse.json(
        { error: "主催者プロフィールが見つかりません" },
        { status: 403 }
      );
    }

    const result = await getDashboardTodos(supabase, organizer.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
