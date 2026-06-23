import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
    const { status: statusFilter } = await searchParams;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

    const exhibitor = exhibitors?.[0];
    if (!exhibitor) {
        redirect("/onboarding");
    }

    const { data: allApps } = await supabase
        .from("event_applications")
        .select(`
            id, status, created_at,
            event:events ( id, event_name, event_start_date, venue_name, main_image_url )
        `)
        .eq("exhibitor_id", exhibitor.id)
        .order("created_at", { ascending: false });

    const applications = allApps || [];
    const totalCount = applications.length;
    const pendingCount = applications.filter((a: any) => a.status === "pending").length;
    const approvedCount = applications.filter((a: any) => a.status === "approved").length;
    const rejectedCount = applications.filter((a: any) => a.status === "rejected").length;

    const active = statusFilter || "all";
    const filtered = active === "all" ? applications : applications.filter((a: any) => a.status === active);

    const filterTabs = [
        { label: "すべて", value: "all", count: totalCount },
        { label: "審査中", value: "pending", count: pendingCount },
        { label: "採用", value: "approved", count: approvedCount },
        { label: "不採用", value: "rejected", count: rejectedCount },
    ];

    const statusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return { label: "採用", className: "bg-store-100 text-store-700" };
            case "rejected":
                return { label: "不採用", className: "bg-slate-100 text-slate-500" };
            default:
                return { label: "審査中", className: "bg-amber-100 text-amber-700" };
        }
    };
    const statusNote = (status: string) =>
        status === "approved" ? "出店確定" : status === "rejected" ? "結果通知済み" : "審査中";

    return (
        <div className="min-h-screen bg-[#f0fdf4] flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">応募状況</h1>
                    <p className="text-sm text-slate-500 mt-1">これまでの応募状況を確認できます</p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-2 mb-6 w-fit">
                    {filterTabs.map((tab) => (
                        <Link
                            key={tab.value}
                            href={tab.value === "all" ? "/applications" : `/applications?status=${tab.value}`}
                            className={cn(
                                "inline-flex items-center justify-center text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                                active === tab.value ? "text-white bg-store-500" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {tab.label} {tab.count}
                        </Link>
                    ))}
                </div>

                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((app: any) => {
                            const ev = app.event;
                            const badge = statusBadge(app.status);
                            return (
                                <div key={app.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    {ev?.main_image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={ev.main_image_url} alt="" className="w-full h-32 object-cover bg-slate-100" />
                                    ) : (
                                        <div className="w-full h-32 bg-store-50" />
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs text-slate-400">
                                                {ev?.event_start_date ? new Date(ev.event_start_date).toLocaleDateString("ja-JP") : "日付未定"}
                                            </p>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 mt-1 truncate">{ev?.event_name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                                            {[ev?.venue_name, statusNote(app.status)].filter(Boolean).join("　・　")}
                                        </p>
                                        <Link
                                            href={`/applications/${app.id}`}
                                            className="mt-3 w-full inline-flex items-center justify-center bg-store-500 hover:bg-store-600 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                                        >
                                            詳細
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-store-50 rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-8 h-8 text-store-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {active === "all" ? "まだ応募がありません" : "該当する応募がありません"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm">
                            {active === "all" ? "気になるイベントを探して応募してみましょう。" : "フィルターを変更してお試しください。"}
                        </p>
                        {active === "all" && (
                            <Link href="/events" className="mt-6 inline-flex items-center justify-center bg-store-500 hover:bg-store-600 text-white font-semibold rounded-xl px-6 py-3 transition-colors">
                                イベントを探す
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
