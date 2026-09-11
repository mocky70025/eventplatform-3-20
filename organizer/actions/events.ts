"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateEventStatus(eventId: string, action: "publish" | "reject" | "delete") {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    // Get organizer profile
    const { data: profile } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        return { error: "主催者プロフィールが見つかりません" };
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: event } = await supabase
        .from("events")
        .select("id, status, event_name")
        .eq("id", eventId)
        .eq("organizer_id", profile.id)
        .single();

    if (!event) {
        return { error: "イベントが見つかりません" };
    }

    let newStatus: string;
    let auditAction: string;

    switch (action) {
        case "publish":
            if (event.status !== "draft" && event.status !== "pending") {
                return { error: "公開できるのは下書きまたは承認待ちのイベントのみです" };
            }
            newStatus = "published";
            auditAction = "publish";
            break;
        case "reject":
            newStatus = "rejected";
            auditAction = "reject";
            break;
        case "delete":
            newStatus = "deleted";
            auditAction = "delete";
            break;
        default:
            return { error: "無効なアクションです" };
    }

    const { error: updateError } = await admin
        .from("events")
        .update({ status: newStatus })
        .eq("id", eventId);

    if (updateError) {
        return { error: "ステータスの更新に失敗しました" };
    }

    // Audit log
    await admin
        .from("admin_audit_logs")
        .insert({
            admin_email: user.email,
            action: auditAction,
            target_type: "event",
            target_id: eventId,
            details: { previous_status: event.status, new_status: newStatus },
        });

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return { success: true, newStatus };
}