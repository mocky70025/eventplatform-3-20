import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { Star, CalendarDays, MapPin, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LoginRequired } from "@/components/LoginRequired";

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-900">{rating.toFixed(1)}</span>
        </div>
    );
}

interface PageProps {
    searchParams: Promise<{ year?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
    const { year } = await searchParams;

    const supabase = await createClient();
    const user = await getUserWithRefresh(supabase);
    if (!user) return <LoginRequired label="出店履歴" />;

    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
    const exhibitor = exhibitors?.[0];
    if (!exhibitor) redirect("/onboarding");

    // 承認済み応募を全件取得
    const { data: apps } = await supabase
        .from("event_applications")
        .select(`
            id,
            events(id, event_name, event_start_date, venue_name, status, organizer_id)
        `)
        .eq("exhibitor_id", exhibitor.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

    // このユーザーが受け取ったレビューを取得
    const { data: receivedReviews } = await supabase
        .from("event_reviews")
        .select("event_id, rating")
        .eq("reviewee_id", user.id)
        .eq("reviewee_type", "exhibitor");

    const reviewByEvent = new Map<string, number>();
    (receivedReviews || []).forEach((r: any) => {
        reviewByEvent.set(r.event_id, r.rating);
    });

    // 全エントリを構築
    type HistoryEntry = {
        appId: string;
        eventId: string;
        eventName: string;
        eventDate: string | null;
        venueName: string | null;
        eventStatus: string;
        rating: number | null;
        isCompleted: boolean;
    };

    const allEntries: HistoryEntry[] = (apps || [])
        .filter((a: any) => a.events)
        .map((a: any) => {
            const ev = a.events as any;
            const isCompleted = ev.status === "ended" || ev.status === "closed";
            return {
                appId: a.id,
                eventId: ev.id,
                eventName: ev.event_name,
                eventDate: ev.event_start_date,
                venueName: ev.venue_name,
                eventStatus: ev.status,
                rating: reviewByEvent.get(ev.id) ?? null,
                isCompleted,
            };
        })
        .sort((a: HistoryEntry, b: HistoryEntry) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            if (!a.eventDate) return 1;
            if (!b.eventDate) return -1;
            return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        });

    // 年フィルター用の年一覧
    const years = Array.from(
        new Set(
            allEntries
                .filter((e) => e.eventDate)
                .map((e) => new Date(e.eventDate!).getFullYear())
        )
    ).sort((a, b) => b - a);

    // 年フィルター適用
    const selectedYear = year && year !== "all" ? parseInt(year) : null;
    const filtered = selectedYear
        ? allEntries.filter(
              (e) => e.eventDate && new Date(e.eventDate).getFullYear() === selectedYear
          )
        : allEntries;

    // 統計計算
    const completed = allEntries.filter((e) => e.isCompleted);
    const currentYear = new Date().getFullYear();
    const thisYearCompleted = completed.filter(
        (e) => e.eventDate && new Date(e.eventDate).getFullYear() === currentYear
    );
    const ratings = completed.filter((e) => e.rating !== null).map((e) => e.rating as number);
    const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

    // リピート率: 同じイベントに複数回出店している割合（イベント名ベース）
    const nameCounts = new Map<string, number>();
    completed.forEach((e) => {
        nameCounts.set(e.eventName, (nameCounts.get(e.eventName) || 0) + 1);
    });
    const repeatCount = Array.from(nameCounts.values()).filter((c) => c > 1).length;
    const repeatRate = nameCounts.size > 0 ? Math.round((repeatCount / nameCounts.size) * 100) : 0;

    const statusLabel = (s: string) => {
        if (s === "ended" || s === "closed") return { text: "完了", cls: "bg-store-100 text-store-700" };
        if (s === "published") return { text: "出店予定", cls: "bg-sky-100 text-sky-700" };
        return { text: s, cls: "bg-slate-100 text-slate-600" };
    };

    return (
        <div className="min-h-screen bg-[#f0fdf4]">

            <main className="max-w-5xl mx-auto py-8 px-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">出店履歴</h1>
                        <p className="text-sm text-slate-500 mt-1">過去に参加したイベントの一覧です。</p>
                    </div>
                    <select
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-store-500"
                        defaultValue={year || "all"}
                        onChange={undefined}
                        // Year filter is server-side via form submit
                    >
                        <option value="all">すべての年</option>
                        {years.map((y) => (
                            <option key={y} value={String(y)}>
                                {y}年
                            </option>
                        ))}
                    </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-500 font-medium mb-1">総出店回数</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {completed.length}
                            <span className="text-sm font-medium text-slate-500 ml-1">回</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-500 font-medium mb-1">平均評価</p>
                        {avgRating !== null ? (
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={cn(
                                                "w-4 h-4",
                                                s <= Math.round(avgRating)
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-slate-200 fill-slate-200"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-slate-500">-</p>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-500 font-medium mb-1">今年の出店</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {thisYearCompleted.length}
                            <span className="text-sm font-medium text-slate-500 ml-1">回</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs text-slate-500 font-medium mb-1">リピート率</p>
                        <p className="text-2xl font-bold text-store-600">
                            {repeatRate}
                            <span className="text-sm font-medium text-slate-500 ml-1">%</span>
                        </p>
                    </div>
                </div>

                {/* Table */}
                {filtered.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        イベント
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">
                                        開催日
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">
                                        会場
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">
                                        評価
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">
                                        ステータス
                                    </th>
                                    <th className="px-4 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((entry) => {
                                    const status = statusLabel(entry.eventStatus);
                                    return (
                                        <tr key={entry.appId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-store-100 to-store-200 flex items-center justify-center shrink-0">
                                                        <Trophy className="w-5 h-5 text-store-500" strokeWidth={1.5} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {entry.eventName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {entry.eventDate
                                                        ? new Date(entry.eventDate).toLocaleDateString("ja-JP")
                                                        : "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    {entry.venueName || "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {entry.rating !== null ? (
                                                    <StarRating rating={entry.rating} />
                                                ) : (
                                                    <span className="text-xs text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={cn(
                                                        "h-6 inline-flex items-center justify-center px-2.5 rounded-full text-xs font-semibold",
                                                        status.cls
                                                    )}
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    href={`/applications/${entry.appId}`}
                                                    className="text-xs text-store-600 font-medium hover:underline"
                                                >
                                                    詳細
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">出店履歴はありません</h3>
                        <p className="text-slate-500 mt-2 mb-6">
                            イベントへの出店が承認されると、ここに履歴が表示されます。
                        </p>
                        <Link
                            href="/events"
                            className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-store-600 text-white hover:bg-store-700 h-10 px-5 transition-colors"
                        >
                            イベントを探す
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
