import { cn } from "@/lib/utils";
import { Plus, Search, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    published: { label: "募集中", className: "bg-emerald-100 text-emerald-700" },
    draft: { label: "下書き", className: "bg-slate-100 text-slate-600" },
    closed: { label: "募集終了", className: "bg-slate-100 text-slate-600" },
    ended: { label: "終了", className: "bg-slate-100 text-slate-500" },
    pending: { label: "審査中", className: "bg-amber-100 text-amber-700" },
    rejected: { label: "却下", className: "bg-red-100 text-red-700" },
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
function formatDate(d?: string | null): string {
    if (!d) return "日程未定";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}（${WEEKDAYS[dt.getDay()]}）`;
}

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const supabase = await createClient();
    const user = await getUserWithRefresh(supabase);

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

    // New (pending) application count per event
    const eventIds = safeEvents.map((e) => e.id);
    const pendingByEvent: Record<string, number> = {};
    if (eventIds.length > 0) {
        const { data: pendingApps } = await supabase
            .from("event_applications")
            .select("event_id")
            .in("event_id", eventIds)
            .eq("status", "pending");
        (pendingApps || []).forEach((a: any) => {
            pendingByEvent[a.event_id] = (pendingByEvent[a.event_id] || 0) + 1;
        });
    }

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
        <div className="min-h-screen bg-[#fdf8f1]">
            <main className="max-w-6xl mx-auto py-8 px-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">イベント管理</h1>
                        <p className="text-sm text-slate-500 mt-1">あなたが作成したイベント一覧</p>
                    </div>
                    {profile?.is_approved && (
                        <Link
                            href="/events/new"
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm shadow-orange-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            新規イベント作成
                        </Link>
                    )}
                </div>

                {/* Filter tabs + search */}
                <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-6 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.key}
                                href={`/events?status=${tab.key}${searchQuery ? `&q=${searchQuery}` : ""}`}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                                    filterStatus === tab.key
                                        ? "bg-orange-500 text-white"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.label}
                                {(statusCounts[tab.key] ?? 0) > 0 && (
                                    <span className="ml-1">{statusCounts[tab.key]}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                    <form className="relative flex-1 min-w-[200px] ml-auto">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            name="q"
                            defaultValue={searchQuery}
                            placeholder="イベント名で検索..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 placeholder:text-slate-500"
                        />
                        <input type="hidden" name="status" value={filterStatus} />
                    </form>
                </div>

                {/* Event grid */}
                {safeEvents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {safeEvents.map((event) => {
                            const appCount = event.event_applications?.[0]?.count || 0;
                            const recruit = event.recruit_count || event.max_exhibitors || 0;
                            const pending = pendingByEvent[event.id] || 0;
                            const pct = recruit > 0 ? Math.min(100, Math.round((appCount / recruit) * 100)) : 0;
                            const statusInfo = STATUS_MAP[event.status] || STATUS_MAP.draft;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex hover:border-orange-200 transition-colors"
                                >
                                    {/* Image */}
                                    <div className="w-[150px] shrink-0 bg-gradient-to-br from-orange-100 to-amber-50 relative">
                                        {event.main_image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={event.main_image_url}
                                                alt={event.event_name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <CalendarDays className="w-8 h-8 text-orange-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 p-5 flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{event.event_name}</h3>
                                            <span
                                                className={cn(
                                                    "shrink-0 inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
                                                    statusInfo.className
                                                )}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="text-sm">
                                            <p className="text-slate-700 font-medium">{formatDate(event.event_start_date)}</p>
                                            {(event.venue_name || event.address) && (
                                                <p className="text-slate-500 text-[13px] truncate mt-0.5">
                                                    {event.venue_name || event.address}
                                                </p>
                                            )}
                                        </div>

                                        {/* Application status */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs text-slate-500 font-medium">応募状況</span>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {appCount}{recruit > 0 && ` / ${recruit}`} 名
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                                            {pending > 0 ? (
                                                <span className="inline-flex items-center text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full">
                                                    新規 {pending}件
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/events/${event.id}`}
                                                    className="text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 transition-colors"
                                                >
                                                    詳細
                                                </Link>
                                                <Link
                                                    href={`/events/${event.id}/edit`}
                                                    className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-4 py-2 transition-colors"
                                                >
                                                    編集
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-orange-50 rounded-full mb-4">
                            <CalendarDays className="h-8 w-8 text-orange-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {filterStatus !== "all" ? "該当するイベントがありません" : "イベントがまだありません"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                            {filterStatus !== "all"
                                ? "フィルタ条件を変更してみてください。"
                                : "最初のイベントを作成して出店者の募集を開始しましょう。"}
                        </p>
                        {filterStatus === "all" && profile?.is_approved && (
                            <Link
                                href="/events/new"
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                新規イベント作成
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
