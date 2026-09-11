"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cancelApplication(applicationId: string, reason?: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    const admin = createAdminClient();

    // Get application with exhibitor check
    const { data: app, error: appError } = await admin
        .from("event_applications")
        .select(`
            *,
            events!inner(event_name, organizer_id),
            exhibitors!inner(shop_name, user_id)
        `)
        .eq("id", applicationId)
        .single();

    if (appError || !app) {
        return { error: "申請が見つかりません" };
    }

    // Verify ownership
    if (app.exhibitors?.user_id !== user.id) {
        return { error: "権限がありません" };
    }

    // Check if cancellable
    if (!['pending', 'additional_recruit'].includes(app.status)) {
        return { error: "この申請はキャンセルできません" };
    }

    const { error: updateError } = await admin
        .from("event_applications")
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: user.id,
            cancel_reason: reason || null,
        })
        .eq("id", applicationId);

    if (updateError) {
        return { error: "キャンセルに失敗しました" };
    }

    // Audit log
    await admin
        .from("admin_audit_logs")
        .insert({
            admin_email: user.email,
            action: 'cancel',
            target_type: 'application',
            target_id: applicationId,
            details: { previous_status: app.status, reason },
        });

    // Notify organizer
    try {
        const eventName = app.events?.event_name || "イベント";
        const exhibitorName = app.exhibitors?.shop_name || "出店者";

        await admin
            .from("notifications")
            .insert({
                user_id: app.events?.organizer_id,
                user_type: "organizer",
                type: 'application_cancelled',
                title: '出店申請がキャンセルされました',
                message: `「${eventName}」への${exhibitorName}からの出店申請がキャンセルされました。`,
                related_event_id: app.events?.id,
                related_application_id: applicationId,
            });
    } catch {
        // Non-critical
    }

    revalidatePath("/applications");
    revalidatePath(`/applications/${applicationId}`);

    return { success: true };
}