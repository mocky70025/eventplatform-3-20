"use server";

import { createClient } from "@/lib/supabase/server";

export async function createEventDraft() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("認証が必要です。");

    const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
    if (!organizer) throw new Error("主催者プロフィールを作成してください。");

    const { data, error } = await supabase
        .from("events")
        .insert({ organizer_id: organizer.id, status: "draft" })
        .select("id")
        .single();
    if (error) throw new Error("下書きの作成に失敗しました。");

    return data.id;
}
