import { createClient } from "@/lib/supabase/server";
import OrganizerList from "./OrganizerList";

export default async function OrganizersPage() {
    const supabase = await createClient();

    const { data: organizers, error } = await supabase
        .from("organizers")
        .select("id, user_id, company_name, name, email, phone_number, is_approved, created_at")
        .order("created_at", { ascending: false });

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
                    <h1 className="text-2xl font-bold text-slate-900">主催者管理</h1>
                    <p className="text-sm text-slate-500 mt-1">/organizers — 主催者アカウントの管理・承認</p>
                </div>

                <OrganizerList organizers={organizers || []} />
            </main>
        </div>
    );
}
