import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import {
    ClipboardList,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

interface PageProps {
    searchParams: Promise<{
        q?: string;
        status?: string;
        page?: string;
    }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
    const { q, status: statusFilter, page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    const supabase = await createClient();
    let user = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
            user = data.user;
        }
    } catch (error: any) {
        if (error?.name !== 'AuthSessionMissingError' && error?.message !== 'Auth session missing!') {
            console.error("Auth error:", error);
        }
    }

    if (!user) {
        redirect("/login");
    }

    // Get organizer profile
    const { data: profile } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        redirect("/onboarding");
    }

    // Fetch all applications for counting
    const { data: allApplications } = await supabase
        .from("event_applications")
        .select(`
            id,
            status,
            exhibitors(shop_name)
        `)
        .eq("events.organizer_id", profile.id)
        .select(`
            id,
            status,
            events!inner(organizer_id),
            exhibitors(shop_name)
        `);

    const totalCount = allApplications?.length ?? 0;
    const pendingCount = allApplications?.filter(a => a.status === "pending").length ?? 0;
    const approvedCount = allApplications?.filter(a => a.status === "approved").length ?? 0;
    const rejectedCount = allApplications?.filter(a => a.status === "rejected").length ?? 0;

    // Build filtered query
    let query = supabase
        .from("event_applications")
        .select(`
            *,
            events!inner(*),
            exhibitors(*)
        `)
        .eq("events.organizer_id", profile.id)
        .order("created_at", { ascending: false });

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
    }

    const { data: filteredAll } = await query;

    // Apply search filter post-query (search by exhibitor name)
    let filtered = filteredAll || [];
    if (q) {
        const searchLower = q.toLowerCase();
        filtered = filtered.filter(app =>
            (app.exhibitors?.shop_name || "").toLowerCase().includes(searchLower) ||
            (app.exhibitors?.name || "").toLowerCase().includes(searchLower)
        );
    }

    // Paginate
    const filteredCount = filtered.length;
    const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const applications = filtered.slice(from, from + ITEMS_PER_PAGE);

    function buildSearchParams(overrides: Record<string, string | undefined>): string {
        const params = new URLSearchParams();
        const finalQ = overrides.q !== undefined ? overrides.q : q;
        const finalStatus = overrides.status !== undefined ? overrides.status : statusFilter;
        const finalPage = overrides.page !== undefined ? overrides.page : String(currentPage);
        if (finalQ) params.set("q", finalQ);
        if (finalStatus && finalStatus !== "all") params.set("status", finalStatus);
        if (finalPage && finalPage !== "1") params.set("page", finalPage);
        const str = params.toString();
        return str ? `?${str}` : "";
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return { text: "承認済み", className: "bg-emerald-50 text-emerald-700" };
            case "rejected":
                return { text: "却下済み", className: "bg-red-50 text-red-700" };
            default:
                return { text: "審査中", className: "bg-yellow-50 text-yellow-700" };
        }
    };

    const getGenreBadgeColor = (genre: string | undefined) => {
        switch (genre) {
            case "和食":
                return "bg-emerald-100 text-emerald-700";
            case "洋食":
                return "bg-orange-100 text-orange-700";
            case "中華":
                return "bg-pink-100 text-pink-700";
            case "スイーツ":
                return "bg-yellow-50 text-yellow-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const getAvatarColor = (index: number) => {
        const colors = [
            "bg-emerald-100 text-emerald-700",
            "bg-pink-100 text-pink-700",
            "bg-purple-100 text-purple-700",
            "bg-sky-100 text-sky-700",
            "bg-red-100 text-red-700",
            "bg-yellow-100 text-yellow-700",
            "bg-orange-100 text-orange-700",
        ];
        return colors[index % colors.length];
    };

    const activeFilter = statusFilter || "all";

    const filterTabs = [
        { label: "すべて", value: "all", count: totalCount },
        { label: "審査中", value: "pending", count: pendingCount },
        { label: "承認済み", value: "approved", count: approvedCount },
        { label: "不承認", value: "rejected", count: rejectedCount },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-6xl mx-auto py-8 px-6">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm mb-6">
                    <Link href="/" className="text-orange-600 hover:underline">ダッシュボード</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-700 font-medium">出店者管理</span>
                </nav>

                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">出店者管理</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            各イベントへの応募状況を確認・管理できます
                        </p>
                    </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex items-center gap-4 mb-6">
                    <form action="/applications" method="GET" className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={q}
                            placeholder="出店者名で検索..."
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
                        />
                        {statusFilter && statusFilter !== "all" && (
                            <input type="hidden" name="status" value={statusFilter} />
                        )}
                    </form>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                        {filterTabs.map((tab) => (
                            <Link
                                key={tab.value}
                                href={`/applications${buildSearchParams({ status: tab.value, page: "1" })}`}
                                className={cn(
                                    "inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                                    activeFilter === tab.value
                                        ? "text-orange-700 bg-orange-50"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                {tab.label}({tab.count})
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Vendor List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {applications && applications.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6 py-3">出店者名</th>
                                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">ジャンル</th>
                                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">申込日</th>
                                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">ステータス</th>
                                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">アクション</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app, index) => {
                                    const status = getStatusBadge(app.status);
                                    const shopName = app.exhibitors?.shop_name ?? "不明";
                                    const genre = app.exhibitors?.genre;
                                    const firstChar = shopName.charAt(0);

                                    return (
                                        <tr
                                            key={app.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                        getAvatarColor(index)
                                                    )}>
                                                        {firstChar}
                                                    </div>
                                                    <Link
                                                        href={`/applications/${app.id}`}
                                                        className="text-sm font-medium text-orange-600 hover:underline"
                                                    >
                                                        {shopName}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {genre && (
                                                    <span
                                                        className={cn(
                                                            "h-6 inline-flex items-center justify-center px-2 rounded-full text-[10px] font-medium",
                                                            getGenreBadgeColor(genre)
                                                        )}
                                                        style={{ lineHeight: 1 }}
                                                    >
                                                        {genre}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-500">
                                                {new Date(app.created_at).toLocaleDateString('ja-JP')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={cn(
                                                        "h-5 inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-2.5",
                                                        status.className
                                                    )}
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {app.status === "pending" ? (
                                                    <Link href={`/applications/${app.id}`}>
                                                        <button className="text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 border border-orange-500 rounded-xl px-3 py-1.5 transition-colors">
                                                            審査する
                                                        </button>
                                                    </Link>
                                                ) : app.status === "rejected" ? (
                                                    <Link href={`/applications/${app.id}`}>
                                                        <button className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition-colors">
                                                            再審査
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/applications/${app.id}`}>
                                                        <button className="text-xs font-medium text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-colors">
                                                            詳細を見る
                                                        </button>
                                                    </Link>
                                                )}
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
                                {q || (statusFilter && statusFilter !== "all") ? "該当する申し込みが見つかりません" : "まだ申し込みはありません"}
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                {q || (statusFilter && statusFilter !== "all")
                                    ? "検索条件やフィルターを変更してお試しください。"
                                    : "イベントを公開して出店者を募集しましょう。申し込みが届くとここに表示されます。"}
                            </p>
                            {!q && (!statusFilter || statusFilter === "all") && (
                                <Link href="/events/new">
                                    <button className="mt-8 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 h-10 px-4 py-2 shadow-lg shadow-orange-500/20 transition-colors">
                                        新しいイベントを作成
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-2 mt-6">
                        <div className="flex items-center gap-1">
                            {currentPage > 1 ? (
                                <Link
                                    href={`/applications${buildSearchParams({ page: String(currentPage - 1) })}`}
                                    className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                                >
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
                                            href={`/applications${buildSearchParams({ page: String(item) })}`}
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
                                <Link
                                    href={`/applications${buildSearchParams({ page: String(currentPage + 1) })}`}
                                    className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400">
                            {filteredCount}件中 {from + 1}-{Math.min(from + ITEMS_PER_PAGE, filteredCount)}件を表示
                        </span>
                    </div>
                )}

            </main>
        </div>
    );
}
