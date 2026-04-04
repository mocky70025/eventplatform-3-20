"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ApplicationStatusActions({
    initialStatus,
    applicationId,
    eventId
}: {
    initialStatus: string,
    applicationId: string,
    eventId?: string
}) {
    const [status, setStatus] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();
    const router = useRouter();

    const updateStatus = async (newStatus: "approved" | "rejected") => {
        if (!confirm(`${newStatus === 'approved' ? '承認' : '却下'}してよろしいですか？`)) return;
        if (!eventId) {
            setError("イベント情報が不足しています。ページを再読み込みしてください。");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            // Ownership check: ensure the event belongs to the current organizer
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインセッションが見つかりません。");

            const { data: profile } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!profile) throw new Error("主催者プロフィールが見つかりません。");

            // Verify the event belongs to this organizer before updating the application
            const { data: event } = await supabase
                .from("events")
                .select("id")
                .eq("id", eventId)
                .eq("organizer_id", profile.id)
                .single();

            if (!event) throw new Error("このイベントの操作権限がありません。");

            const { error } = await supabase
                .from("event_applications")
                .update({ status: newStatus })
                .eq("id", applicationId)
                .eq("event_id", eventId);

            if (error) throw error;

            // 通知を作成（失敗してもステータス更新はブロックしない）
            try {
                const { data: appData } = await supabase
                    .from("event_applications")
                    .select("exhibitor_id, events(event_name)")
                    .eq("id", applicationId)
                    .single();

                if (appData?.exhibitor_id) {
                    const { data: exhibitor } = await supabase
                        .from("exhibitors")
                        .select("user_id")
                        .eq("id", appData.exhibitor_id)
                        .single();

                    if (exhibitor?.user_id) {
                        const eventName = (appData.events as any)?.event_name || "イベント";
                        const isApproved = newStatus === "approved";
                        await fetch("/api/notifications", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: exhibitor.user_id,
                                user_type: "exhibitor",
                                type: isApproved ? "application_approved" : "application_rejected",
                                title: isApproved ? "出店が承認されました" : "出店申請が見送りになりました",
                                message: isApproved
                                    ? `「${eventName}」への出店が承認されました。イベント詳細をご確認ください。`
                                    : `「${eventName}」への出店申請は見送りとなりました。`,
                                related_event_id: eventId,
                                related_application_id: applicationId,
                            }),
                        });
                    }
                }
            } catch (notifErr) {
                console.error("通知作成に失敗:", notifErr);
            }

            setStatus(newStatus);
            router.refresh();
        } catch (error: any) {
            setError(error.message || "不明なエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'approved') {
        return (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-50 text-green-700 border border-green-200 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                承認済み
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-bold">
                <XCircle className="w-5 h-5" />
                却下済み
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="flex items-center gap-3">
            <Button
                variant="outline"
                onClick={() => updateStatus('rejected')}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 gap-2"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                却下する
            </Button>
            <Button
                onClick={() => updateStatus('approved')}
                disabled={isLoading}
                className="h-12 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-200 gap-2"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <CheckCircle2 className="w-4 h-4" />
                )}
                承認する
            </Button>
            </div>
        </div>
    );
}
