import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import ExhibitorList from "./ExhibitorList";
import { Users } from "lucide-react";

export default async function ExhibitorsPage() {
    const supabase = await createClient();

    const { data: exhibitors, error } = await supabase
        .from("exhibitors")
        .select("id, user_id, shop_name, name, email, phone_number, genre, created_at")
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
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">出店者管理</h1>
                        <p className="text-sm text-slate-500">全出店者の登録状況を管理します</p>
                    </div>
                </div>

                <ExhibitorList exhibitors={exhibitors || []} />
            </main>
        </div>
    );
}
