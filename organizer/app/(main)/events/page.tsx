import { cn } from "@/lib/utils";
import { Plus, Calendar, MapPin, Users, ChevronRight, Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    published: { label: "募集中", className: "bg-orange-100 text-orange-700" },
    draft: { label: "下書き", className: "bg-slate-100 text-slate-600" },
    closed: { label: "募集終了", className: "bg-slate-100 text-slate-600" },
    ended: { label: "終了", className: "bg-slate-100 text-slate-500" },
    pending: { label: "審査中", className: "bg-amber-100 text-amber-700" },
    rejected: { label: "却下", className: "bg-red-100 text-red-700" },
};

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile) {
        redirect("/onboarding");
    }

    const params = await searchParams;
    const filterStatus = params.status || "all";
    const searchQuery = params.q || "";

    let query = supabase
        .from("events")
        .select("*, event_applications(count)")
        .eq("organizer_id", profile.id)
        .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
    }

    if (searchQuery) {
        query = query.ilike("event_name", `%${searchQuery}%`);
    }

    const { data: events } = await query;
    const safeEvents = events || [];

    // Count by status for tabs
    const { data: allEvents } = await supabase
        .from("events")
        .select("status")
        .eq("organizer_id", profile.id);

    const statusCounts: Record<string, number> = { all: allEvents?.length || 0 };
    (allEvents || []).forEach((e: any) => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    });

    const tabs = [
        { key: "all", label: "すべて" },
        { key: "published", label: "募集中" },
        { key: "draft", label: "下書き" },
        { key: "closed", label: "募集終了" },
        { key: "ended", label: "終了" },
    ];

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-6xl mx-auto py-8 px-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">イベント管理</h1>
                        <p className="text-sm text-slate-500 mt-1">作成したイベントの管理・編集ができます。</p>
                    </div>
                    {profile?.is_approved && (
                        <Link
                            href="/events/new"
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            新規作成
                        </Link>
                    )}
                </div>

                {/* Search + Filter tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 mb-6">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100">
                        {tabs.map(tab => (
                            <Link
                                key={tab.key}
                                href={`/events?status=${tab.key}${searchQuery ? `&q=${searchQuery}` : ""}`}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                                    filterStatus === tab.key
                                        ? "border-orange-500 text-orange-700"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.label}
                                {(statusCounts[tab.key] ?? 0) > 0 && (
                                    <span className={cn(
                                        "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                                        filterStatus === tab.key
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-slate-100 text-slate-500"
                                    )}>
                                        {statusCounts[tab.key]}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Search bar */}
                    <form className="flex items-center gap-3 px-4 py-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="イベント名で検索..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <input type="hidden" name="status" value={filterStatus} />
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            検索
                        </button>
                    </form>
                </div>

                {/* Event list */}
                <div className="space-y-3">
                    {safeEvents.length > 0 ? (
                        safeEvents.map((event) => {
                            const appCount = event.event_applications?.[0]?.count || 0;
                            const statusInfo = STATUS_MAP[event.status] || STATUS_MAP.draft;

                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 block hover:border-orange-200 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                    {event.event_name}
                                                </h3>
                                                <span
                                                    className={cn(
                                                        "h-5 inline-flex items-center justify-center text-xs font-semibold px-2.5 rounded-full shrink-0",
                                                        statusInfo.className
                                                    )}
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                {event.event_start_date && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {event.event_start_date}
                                                        {event.event_end_date && event.event_end_date !== event.event_start_date && (
                                                            <> 〜 {event.event_end_date}</>
                                                        )}
                                                    </span>
                                                )}
                                                {(event.venue_name || event.address) && (
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        {event.venue_name || event.address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {event.lead_text && (
                                        <p className="text-sm text-slate-500 mb-3 line-clamp-1">{event.lead_text}</p>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                申込: {appCount}件
                                            </span>
                                            {event.max_exhibitors && (
                                                <span>定員: {event.max_exhibitors}組</span>
                                            )}
                                            {event.fee && (
                                                <span>出店料: {event.fee}</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700 flex items-center gap-1">
                                            詳細を見る
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Calendar className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                                {filterStatus !== "all" ? "該当するイベントがありません" : "イベントがまだありません"}
                            </h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                                {filterStatus !== "all"
                                    ? "フィルタ条件を変更してみてください。"
                                    : "最初のイベントを作成して出店者の募集を開始しましょう。"
                                }
                            </p>
                            {filterStatus === "all" && profile?.is_approved && (
                                <Link
                                    href="/events/new"
                                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    新規作成
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
