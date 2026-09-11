"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function organizerCancelApplication(applicationId: string, reason?: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    // Verify organizer profile
    const { data: profile } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        return { error: "主催者プロフィールが見つかりません" };
    }

    const admin = createAdminClient();

    // Get application with event ownership check
    const { data: app, error: appError } = await admin
        .from("event_applications")
        .select(`
            *,
            events!inner(event_name, organizer_id),
            exhibitors!inner(shop_name, user_id)
        `)
        .eq("id", applicationId)
        .eq("events.organizer_id", profile.id)
        .single();

    if (appError || !app) {
        return { error: "申請が見つかりません" };
    }

    // Check if cancellable
    if (!['pending', 'approved', 'additional_recruit'].includes(app.status)) {
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
            details: { previous_status: app.status, reason, cancelled_by_organizer: true },
        });

    // Notify exhibitor
    try {
        const eventName = app.events?.event_name || "イベント";
        const exhibitorUserId = app.exhibitors?.user_id;

        if (exhibitorUserId) {
            await admin
                .from("notifications")
                .insert({
                    user_id: exhibitorUserId,
                    user_type: "exhibitor",
                    type: 'application_cancelled',
                    title: '出店申請がキャンセルされました',
                    message: `「${eventName}」への出店申請が主催者によってキャンセルされました。${reason ? `理由: ${reason}` : ''}`,
                    related_event_id: app.events?.id,
                    related_application_id: applicationId,
                });
        }
    } catch {
        // Non-critical
    }

    revalidatePath("/applications");
    revalidatePath(`/applications/${applicationId}`);

    return { success: true };
}

export async function reopenRecruitment(applicationId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    // Verify organizer profile
    const { data: profile } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        return { error: "主催者プロフィールが見つかりません" };
    }

    const admin = createAdminClient();

    // Get application with event ownership check
    const { data: app, error: appError } = await admin
        .from("event_applications")
        .select(`
            *,
            events!inner(event_name, organizer_id),
            exhibitors!inner(shop_name, user_id)
        `)
        .eq("id", applicationId)
        .eq("events.organizer_id", profile.id)
        .single();

    if (appError || !app) {
        return { error: "申請が見つかりません" };
    }

    // Only allow if previously rejected or cancelled
    if (!['rejected', 'cancelled'].includes(app.status)) {
        return { error: "この申請は再募集できません" };
    }

    const { error: updateError } = await admin
        .from("event_applications")
        .update({
            status: 'additional_recruit',
        })
        .eq("id", applicationId);

    if (updateError) {
        return { error: "再募集設定に失敗しました" };
    }

    // Audit log
    await admin
        .from("admin_audit_logs")
        .insert({
            admin_email: user.email,
            action: 'additional_recruit',
            target_type: 'application',
            target_id: applicationId,
            details: { previous_status: app.status },
        });

    // Notify exhibitor
    try {
        const eventName = app.events?.event_name || "イベント";
        const exhibitorUserId = app.exhibitors?.user_id;

        if (exhibitorUserId) {
            await admin
                .from("notifications")
                .insert({
                    user_id: exhibitorUserId,
                    user_type: "exhibitor",
                    type: 'additional_recruit_opened',
                    title: '追加募集が開始されました',
                    message: `「${eventName}」で追加募集が開始されました。再度応募をご検討ください。`,
                    related_event_id: app.events?.id,
                    related_application_id: applicationId,
                });
        }
    } catch {
        // Non-critical
    }

    revalidatePath("/applications");
    revalidatePath(`/applications/${applicationId}`);

    return { success: true, newStatus: 'additional_recruit' };
}