import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        // Verify admin (check if user is admin via email list)
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const userEmail = user.email || "";
        if (!adminEmails.includes(userEmail)) {
            return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
        }

        const { applicationId, status } = await request.json();

        if (!applicationId || !status) {
            return NextResponse.json({ error: "applicationId と status は必須です" }, { status: 400 });
        }

        const validStatuses = ["pending", "approved", "rejected", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
        }

        const admin = createAdminClient();

        // Get application details for notification
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
            return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
        }

        // Update application status
        const { error: updateError } = await admin
            .from("event_applications")
            .update({ status })
            .eq("id", applicationId);

        if (updateError) {
            return NextResponse.json({ error: "ステータスの更新に失敗しました" }, { status: 500 });
        }

        // Log audit
        await admin
            .from("admin_audit_logs")
            .insert({
                admin_email: user.email,
                action: status === 'cancelled' ? 'cancel' : status,
                target_type: 'application',
                target_id: applicationId,
                details: { previous_status: app.status, new_status: status },
            });

        // Send notification to exhibitor
        try {
            const eventName = app.events?.event_name || "イベント";
            const exhibitorUserId = app.exhibitors?.user_id;

            if (exhibitorUserId) {
                await admin
                    .from("notifications")
                    .insert({
                        user_id: exhibitorUserId,
                        user_type: "exhibitor",
                        type: status === 'approved' ? 'application_approved' : 
                              status === 'rejected' ? 'application_rejected' :
                              status === 'cancelled' ? 'application_cancelled' : 'confirmed',
                        title: status === 'approved' ? '出店が承認されました' :
                               status === 'rejected' ? '出店申請の結果について' :
                               status === 'cancelled' ? '出店申請がキャンセルされました' : 'ステータスが更新されました',
                        message: status === 'approved' 
                            ? `「${eventName}」への出店申請が承認されました。`
                            : status === 'rejected'
                            ? `「${eventName}」への出店申請は、今回は見送りとなりました。`
                            : status === 'cancelled'
                            ? `「${eventName}」への出店申請が管理者によってキャンセルされました。`
                            : `「${eventName}」の申請ステータスが更新されました。`,
                        related_event_id: app.events?.id,
                        related_application_id: applicationId,
                    });
            }
        } catch {
            // Notification failure is non-critical
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}