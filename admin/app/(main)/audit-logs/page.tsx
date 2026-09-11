import { createClient } from "@/lib/supabase/server";
import AuditLogList from "./AuditLogList";

export default async function AuditLogsPage() {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        return (
            <div className="min-h-screen bg-[#eff4fb] flex flex-col">
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-red-500">データの取得に失敗しました。時間をおいて再度お試しください。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#eff4fb] flex flex-col">

            <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">監査ログ</h1>
                    <p className="text-sm text-slate-500 mt-1">/audit-logs — 管理者操作の履歴</p>
                </div>

                <AuditLogList logs={logs || []} />
            </main>
        </div>
    );
}