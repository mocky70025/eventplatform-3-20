import { createClient } from "@/lib/supabase/server";
import ApplicationManagementList from "./ApplicationManagementList";

export default async function ApplicationManagementPage() {
    const supabase = await createClient();

    const { data: applications, error } = await supabase
        .from("event_applications")
        .select(`
            *,
            events!inner(event_name, status, genre, event_start_date, venue_name, organizer_id),
            exhibitors!inner(shop_name, name, email, phone_number, genre),
            organizers!inner(company_name, name, email)
        `)
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
                    <h1 className="text-2xl font-bold text-slate-900">申請管理（管理者）</h1>
                    <p className="text-sm text-slate-500 mt-1">/applications — 全申請の監視・強制操作</p>
                </div>

                <ApplicationManagementList applications={applications as any || []} />
            </main>
        </div>
    );
}