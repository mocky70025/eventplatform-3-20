import { createClient } from "@/lib/supabase/server";
import { ClipboardList, ChevronLeft, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        status?: string;
        page?: string;
    }>;
}

export default async function EventApplicationsPage({ params, searchParams }: PageProps) {
    const { id: eventId } = await params;
    const { status: statusFilter, page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        redirect("/login");
    }
    const user = userData.user;

    const { data: profile } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        redirect("/onboarding");
    }

    // Verify this event belongs to the organizer
    const { data: event } = await supabase
        .from("events")
        .select("id, event_name, recruit_count, max_exhibitors")
        .eq("id", eventId)
        .eq("organizer_id", profile.id)
        .single();

    if (!event) {
        notFound();
    }

    // Fetch applications for this event
    const { data: allApps } = await supabase
        .from("event_applications")
        .select(`
            *,
            exhibitors(*)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

    const allApplications = allApps || [];

    const totalCount = allApplications.length;
    const pendingCount = allApplications.filter(a => a.status === "pending").length;
    const approvedCount = allApplications.filter(a => a.status === "approved").length;
    const rejectedCount = allApplications.filter(a => a.status === "rejected").length;
    const recruit = (event as any).recruit_count || (event as any).max_exhibitors || 0;

    let filtered = allApplications;
    if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter(a => a.status === statusFilter);
    }

    const actualFilteredCount = filtered.length;
    const totalPages = Math.ceil(actualFilteredCount / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const applications = filtered.slice(from, from + ITEMS_PER_PAGE);

    const baseRoute = `/events/${eventId}/applications`;

    function buildSearchParams(overrides: Record<string, string | undefined>): string {
        const params = new URLSearchParams();
        const finalStatus = overrides.status !== undefined ? overrides.status : statusFilter;
        const finalPage = overrides.page !== undefined ? overrides.page : String(currentPage);
        if (finalStatus && finalStatus !== "all") params.set("status", finalStatus);
        if (finalPage && finalPage !== "1") params.set("page", finalPage);
        const str = params.toString();
        return str ? `?${str}` : "";
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return { text: "承認", className: "bg-emerald-100 text-emerald-700" };
            case "rejected":
                return { text: "却下", className: "bg-slate-100 text-slate-500" };
            default:
                return { text: "未対応", className: "bg-orange-100 text-orange-700" };
        }
    };

    const activeFilter = statusFilter || "all";
    const filterTabs = [
        { label: "すべて", value: "all", count: totalCount },
        { label: "未対応", value: "pending", count: pendingCount },
        { label: "承認", value: "approved", count: approvedCount },
        { label: "却下", value: "rejected", count: rejectedCount },
    ];

    return (
        <div className="min-h-screen bg-[#fdf8f1]">
            <main className="max-w-6xl mx-auto py-8 px-6">

                {/* Back link */}
                <Link
                    href={`/events/${eventId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
                >
                    <ChevronLeft className="w-4 h-4" /> イベント詳細に戻る
                </Link>

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">{event.event_name} の応募</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        全 {totalCount} 件の応募　・　募集 {approvedCount} / {recruit} 名
                    </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-2 mb-6">
                    {filterTabs.map((tab) => (
                        <Link
                            key={tab.value}
                            href={`${baseRoute}${buildSearchParams({ status: tab.value, page: "1" })}`}
                            className={cn(
                                "inline-flex items-center justify-center text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                                activeFilter === tab.value
                                    ? "text-white bg-orange-500"
                                    : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {tab.label} {tab.count}
                        </Link>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {applications && applications.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-xs font-semibold text-slate-400 px-6 py-3">出店者</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">申請日</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">評価</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">ステータス</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => {
                                    const status = getStatusBadge(app.status);
                                    const shopName = app.exhibitors?.shop_name ?? "不明";
                                    const genre = app.exhibitors?.genre;
                                    const rating = app.exhibitors?.rating;
                                    return (
                                        <tr key={app.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/applications/${app.id}`} className="block">
                                                    <p className="text-sm font-bold text-slate-900">{shopName}</p>
                                                    {genre && <p className="text-xs text-slate-400 mt-0.5">{genre}</p>}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500">
                                                {new Date(app.created_at).toLocaleDateString('ja-JP').replace(/\//g, '/')}
                                            </td>
                                            <td className="px-4 py-4">
                                                {rating ? (
                                                    <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                        {rating}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={cn(
                                                        "h-6 inline-flex items-center justify-center text-xs font-semibold rounded-full px-3",
                                                        status.className
                                                    )}
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/applications/${app.id}`}
                                                    className="inline-flex items-center justify-center text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:bg-slate-50 transition-colors"
                                                >
                                                    詳細
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ClipboardList className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {statusFilter && statusFilter !== "all" ? "該当する応募が見つかりません" : "まだ応募はありません"}
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                {statusFilter && statusFilter !== "all"
                                    ? "フィルターを変更してお試しください。"
                                    : "イベントを公開すると出店者から応募が届きます。"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-2 mt-6">
                        <div className="flex items-center gap-1">
                            {currentPage > 1 ? (
                                <Link href={`${baseRoute}${buildSearchParams({ page: String(currentPage - 1) })}`} className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center">
                                    <ChevronLeft className="w-4 h-4" />
                                </span>
                            )}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - arr[i - 1] > 1) acc.push("dots");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((item, i) =>
                                    item === "dots" ? (
                                        <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">...</span>
                                    ) : (
                                        <Link
                                            key={item}
                                            href={`${baseRoute}${buildSearchParams({ page: String(item) })}`}
                                            className={cn(
                                                "w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center",
                                                item === currentPage
                                                    ? "bg-orange-500 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {item}
                                        </Link>
                                    )
                                )}
                            {currentPage < totalPages ? (
                                <Link href={`${baseRoute}${buildSearchParams({ page: String(currentPage + 1) })}`} className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50">
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400">
                            {actualFilteredCount}件中 {from + 1}-{Math.min(from + ITEMS_PER_PAGE, actualFilteredCount)}件を表示
                        </span>
                    </div>
                )}

            </main>
        </div>
    );
}
