"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationsRead(notificationIds: string[]) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    if (!notificationIds || notificationIds.length === 0) {
        return { error: "通知IDが指定されていません" };
    }

    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds)
        .eq("user_id", user.id);

    if (error) {
        return { error: "既読更新に失敗しました" };
    }

    revalidatePath("/notifications");
    return { success: true };
}

export async function markAllNotificationsRead() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

    if (error) {
        return { error: "一括既読更新に失敗しました" };
    }

    revalidatePath("/notifications");
    return { success: true };
}