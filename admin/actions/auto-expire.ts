"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-expire applications past their application period
 * Should be called via cron (e.g., daily at midnight)
 */
export async function autoExpireApplications() {
    const admin = createAdminClient();

    const today = new Date().toISOString().split("T")[0];

    // Find pending applications where application_period_end has passed
    const { data: expiredApps, error } = await admin
        .from("event_applications")
        .select(`
            id,
            event_id,
            exhibitor_id,
            status,
            events!inner(event_name, application_period_end, organizer_id),
            exhibitors!inner(shop_name, user_id)
        `)
        .eq("status", "pending")
        .lte("events.application_period_end", today);

    if (error) {
        console.error("Auto-expire error:", error);
        return { error: "Failed to fetch expired applications", details: error };
    }

    if (!expiredApps || expiredApps.length === 0) {
        return { success: true, expiredCount: 0 };
    }

    const expiredIds = expiredApps.map(a => a.id);

    // Bulk update to expired
    const { error: updateError } = await admin
        .from("event_applications")
        .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
        })
        .in("id", expiredIds);

    if (updateError) {
        console.error("Auto-expire update error:", updateError);
        return { error: "Failed to update expired applications", details: updateError };
    }

    // Audit logs
    for (const app of expiredApps) {
        await admin
            .from("admin_audit_logs")
            .insert({
                admin_email: "system@cron",
                action: 'expire',
                target_type: 'application',
                target_id: app.id,
                details: { auto_expired: true, application_period_end: (app as any).events?.application_period_end },
            });
    }

    // Notify exhibitors
    for (const app of expiredApps) {
        try {
            const eventName = (app as any).events?.event_name || "イベント";
            const exhibitorUserId = (app as any).exhibitors?.user_id;

            if (exhibitorUserId) {
                await admin
                    .from("notifications")
                    .insert({
                        user_id: exhibitorUserId,
                        user_type: "exhibitor",
                        type: 'application_expired',
                        title: '募集期限切れとなりました',
                        message: `「${eventName}」への出店申請は、募集期限が過ぎたため自動的に期限切れとなりました。`,
                        related_event_id: (app as any).events?.id,
                        related_application_id: app.id,
                    });
            }
        } catch {
            // Non-critical
        }
    }

    // Notify organizers (summary)
    const organizerIds = [...new Set(expiredApps.map(a => (a as any).events?.organizer_id).filter(Boolean))];
    for (const organizerId of organizerIds) {
        try {
            await admin
                .from("notifications")
                .insert({
                    user_id: organizerId,
                    user_type: "organizer",
                    type: 'application_expired',
                    title: '期限切れ申請がありました',
                    message: `${expiredApps.filter(a => (a as any).events?.organizer_id === organizerId).length}件の申請が期限切れとなりました。`,
                });
        } catch {
            // Non-critical
        }
    }

    return { success: true, expiredCount: expiredApps.length };
}