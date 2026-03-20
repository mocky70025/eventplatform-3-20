import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import OrganizerList from "./OrganizerList";
import { Building2 } from "lucide-react";

export default async function OrganizersPage() {
    const supabase = await createClient();

    const { data: organizers, error } = await supabase
        .from("organizers")
        .select("id, user_id, company_name, name, email, phone_number, is_approved, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-red-500">データの取得に失敗しました。時間をおいて再度お試しください。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">主催者管理</h1>
                        <p className="text-sm text-slate-500">全主催者の登録状況と承認状態を管理します</p>
                    </div>
                </div>

                <OrganizerList organizers={organizers || []} />
            </main>
        </div>
    );
}
