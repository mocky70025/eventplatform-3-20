"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const supabase = createClient();
    const router = useRouter();

    const updateStatus = async (newStatus: "approved" | "rejected" | "cancelled", reason?: string) => {
        const label = newStatus === "approved" ? "承認" : newStatus === "rejected" ? "却下" : "キャンセル";
        if (newStatus !== "cancelled" && !confirm(`${label}してよろしいですか？`)) return;
        if (!eventId) {
            setError("イベント情報が不足しています。ページを再読み込みしてください。");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインセッションが見つかりません。");

            const { data: profile } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!profile) throw new Error("主催者プロフィールが見つかりません。");

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

            // 通知（失敗してもステータス更新はブロックしない）
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
                        const typeMap: Record<string, string> = { approved: "application_approved", rejected: "application_rejected", cancelled: "application_cancelled" };
                        const titleMap: Record<string, string> = { approved: "出店が承認されました", rejected: "出店申請が見送りになりました", cancelled: "出店がキャンセルされました" };
                        const msgMap: Record<string, string> = {
                            approved: `「${eventName}」への出店が承認されました。イベント詳細をご確認ください。`,
                            rejected: `「${eventName}」への出店申請は見送りとなりました。`,
                            cancelled: `「${eventName}」への出店（承認済み）が主催者によりキャンセルされました。${reason ? `\n理由: ${reason}` : ""}`,
                        };
                        await fetch("/api/notifications", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: exhibitor.user_id,
                                user_type: "exhibitor",
                                type: typeMap[newStatus],
                                title: titleMap[newStatus],
                                message: msgMap[newStatus],
                                related_event_id: eventId,
                                related_application_id: applicationId,
                            }),
                        });
                    }
                }
            } catch {
                // Notification creation is non-critical; swallow failures.
            }

            setStatus(newStatus);
            setCancelOpen(false);
            router.refresh();
        } catch (error: any) {
            setError(error.message || "不明なエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "approved") {
        return (
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-50 text-green-700 border border-green-200 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    承認済み
                </div>
                {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
                {!cancelOpen ? (
                    <button
                        type="button"
                        onClick={() => setCancelOpen(true)}
                        className="block text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                        承認を取り消してキャンセルする
                    </button>
                ) : (
                    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <p className="text-sm text-slate-600">やむを得ない事情で承認済みの出店をキャンセルします。理由を出店者に通知します。</p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            placeholder="例：会場都合により当該区画の出店を中止することになりました。"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-slate-400"
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => updateStatus("cancelled", cancelReason)}
                                disabled={isLoading}
                                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                キャンセルを確定
                            </Button>
                            <button type="button" onClick={() => setCancelOpen(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2">
                                やめる
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === "rejected") {
        return (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-bold">
                <XCircle className="w-5 h-5" />
                却下済み
            </div>
        );
    }

    if (status === "cancelled") {
        return (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                <Ban className="w-5 h-5" />
                キャンセル済み
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
                    onClick={() => updateStatus("rejected")}
                    disabled={isLoading}
                    className="h-12 px-6 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 gap-2"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    却下する
                </Button>
                <Button
                    onClick={() => updateStatus("approved")}
                    disabled={isLoading}
                    className="h-12 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-200 gap-2"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    承認する
                </Button>
            </div>
        </div>
    );
}
