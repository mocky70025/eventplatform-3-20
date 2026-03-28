import { createClient } from "@/lib/supabase/server";
import EventList from "./EventList";
import { FileText } from "lucide-react";

export default async function EventsPage() {
    const supabase = await createClient();

    const { data: events, error } = await supabase
        .from("events")
        .select(`
            id, event_name, status, genre, description, booth_content,
            event_start_date, event_end_date, event_time, postponed_date, application_period_end,
            venue_name, address, recruit_count, fee, venue_rules, loading_info,
            main_image_url, venue_layout_url,
            terms_compliance, booth_qualification, privacy_policy, cancel_policy,
            organizer_name, organizer_email, organizer_phone,
            created_at, organizer_id,
            organizer:organizers(company_name, name, email, phone_number, is_approved)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-red-500">データの取得に失敗しました。時間をおいて再度お試しください。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-purple-50 rounded-xl">
                        <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">イベント管理</h1>
                        <p className="text-sm text-slate-500">プラットフォーム上の全イベントの公開状態と不適切な内容を管理します</p>
                    </div>
                </div>

                <EventList events={events as any || []} />
            </main>
        </div>
    );
}
