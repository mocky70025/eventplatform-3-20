"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

export function CancelApplicationButton({ applicationId }: { applicationId: string }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleCancel = async () => {
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");

            // 現在のユーザーの出展者IDを取得
            const { data: exhibitors } = await supabase
                .from("exhibitors")
                .select("id")
                .eq("user_id", user.id)
                .limit(1);
            const exhibitor = exhibitors?.[0];
            if (!exhibitor) throw new Error("出展者情報が見つかりません");

            const { error } = await supabase
                .from("event_applications")
                .delete()
                .eq("id", applicationId)
                .eq("exhibitor_id", exhibitor.id);

            if (error) throw error;

            router.push("/applications");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "取り消しに失敗しました");
            setIsConfirming(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isConfirming) {
        return (
            <div className="space-y-2">
                <p className="text-xs text-red-500 text-center">本当に取り消しますか？この操作は元に戻せません。</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsConfirming(false)}
                        disabled={isLoading}
                        className="flex-1 text-xs font-medium text-slate-600 py-2.5 rounded-xl border border-slate-200 text-center"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        {isLoading ? "処理中..." : "取り消す"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-600">{error}</div>
            )}
            <button
                onClick={handleCancel}
                className="w-full text-xs font-medium text-red-400 hover:text-red-600 py-2.5 rounded-xl border border-red-200 text-center flex items-center justify-center gap-1.5"
            >
                <X className="w-4 h-4" />
                申し込みを取り消す
            </button>
        </div>
    );
}
