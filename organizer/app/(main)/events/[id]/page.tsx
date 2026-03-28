"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar, MapPin, Users, CheckCircle2, XCircle,
    ArrowLeft, ExternalLink, Clock,
    Edit, AlertCircle, Loader2, Copy, Trash2,
    FileText, ClipboardList, Building2, Tag,
    Image as ImageIcon, Share2, Download, Settings, Check, X
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventDetail {
    id: string;
    event_name: string;
    genre: string;
    description: string;
    event_start_date: string;
    event_end_date: string;
    event_time: string;
    venue_name: string;
    address: string;
    main_image_url: string;
    status: string;
    recruit_count: number;
    fee: string;
}

interface Application {
    id: string;
    status: string;
    message: string;
    created_at: string;
    exhibitor: {
        id: string;
        shop_name: string;
        name: string;
        genre: string;
        email: string;
    };
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const supabase = createClient();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");

            // Get organizer profile
            const { data: org } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!org) throw new Error("主催者プロフィールが見つかりません");

            // Fetch event with ownership check
            const { data: eventData, error: eventError } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .eq("organizer_id", org.id)
                .single();

            if (eventError) throw eventError;
            if (!eventData) throw new Error("イベントが見つからないか、アクセス権がありません");
            setEvent(eventData);

            // Fetch applications
            const { data: appData, error: appError } = await supabase
                .from("event_applications")
                .select(`
                    id,
                    status,
                    message,
                    created_at,
                    exhibitor:exhibitors (
                        id,
                        shop_name,
                        name,
                        genre,
                        email
                    )
                `)
                .eq("event_id", eventId)
                .order("created_at", { ascending: false });

            if (appError) throw appError;
            // Supabase returns joined relations as arrays; normalize to single objects
            const normalized = (appData ?? []).map((app) => ({
                ...app,
                exhibitor: Array.isArray(app.exhibitor) ? app.exhibitor[0] : app.exhibitor,
            }));
            setApplications(normalized as unknown as Application[]);

        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.message || "データの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    }, [eventId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDuplicate = async () => {
        if (!event) return;
        if (!confirm("このイベントを複製しますか？")) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");
            const { data: org } = await supabase.from("organizers").select("id").eq("user_id", user.id).single();
            if (!org) throw new Error("主催者プロフィールが見つかりません");
            const { id: _eventId, ...rest } = event;
            const { data: newEvent, error } = await supabase
                .from("events")
                .insert({ ...rest, event_name: `${event.event_name}（コピー）`, status: "draft", organizer_id: org.id })
                .select("id")
                .single();
            if (error) throw error;
            router.push(`/events/${newEvent.id}`);
        } catch (err: any) {
            setActionMessage({ type: "error", text: "複製に失敗しました: " + (err.message || "不明なエラー") });
        }
    };

    const handleDelete = async () => {
        if (!event) return;
        if (!confirm(`「${event.event_name}」を削除しますか？この操作は元に戻せません。`)) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");
            const { data: org } = await supabase.from("organizers").select("id").eq("user_id", user.id).single();
            if (!org) throw new Error("主催者プロフィールが見つかりません");

            // Delete with ownership check
            const { error } = await supabase
                .from("events")
                .delete()
                .eq("id", eventId)
                .eq("organizer_id", org.id);
            if (error) throw error;
            router.push("/");
        } catch (err: any) {
            setActionMessage({ type: "error", text: "削除に失敗しました: " + (err.message || "不明なエラー") });
        }
    };

    const handleShare = async () => {
        const storeUrl = `${window.location.origin.replace("organizer.", "store.")}/events/${eventId}`;
        const url = storeUrl.includes("store.") ? storeUrl : `${window.location.origin}/events/${eventId}`;
        if (navigator.share) {
            try { await navigator.share({ title: event?.event_name, url }); } catch { /* cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setActionMessage({ type: "success", text: "URLをクリップボードにコピーしました" });
                setTimeout(() => setActionMessage(null), 3000);
            } catch {
                prompt("以下のURLをコピーしてください:", url);
            }
        }
    };

    const handleExportCSV = () => {
        if (applications.length === 0) {
            setActionMessage({ type: "error", text: "エクスポートする応募データがありません" });
            return;
        }
        const headers = ["店舗名", "代表者名", "ジャンル", "メールアドレス", "応募日", "ステータス", "メッセージ"];
        const rows = applications.map(app => [
            app.exhibitor?.shop_name || "",
            app.exhibitor?.name || "",
            app.exhibitor?.genre || "",
            app.exhibitor?.email || "",
            new Date(app.created_at).toLocaleDateString("ja-JP"),
            app.status === "approved" ? "承認済み" : app.status === "rejected" ? "却下" : "審査中",
            app.message || "",
        ]);
        const bom = "\uFEFF";
        const csv = bom + [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${event?.event_name || "応募者リスト"}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleUpdateStatus = async (applicationId: string, newStatus: "approved" | "rejected" | "pending") => {
        setIsActionLoading(applicationId);
        try {
            // Re-verify event ownership before updating application status
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");

            const { data: org } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!org) throw new Error("主催者プロフィールが見つかりません");

            // Verify this event belongs to the current organizer
            const { data: ownedEvent } = await supabase
                .from("events")
                .select("id")
                .eq("id", eventId)
                .eq("organizer_id", org.id)
                .single();
            if (!ownedEvent) throw new Error("このイベントの操作権限がありません");

            const { error } = await supabase
                .from("event_applications")
                .update({ status: newStatus })
                .eq("id", applicationId)
                .eq("event_id", eventId);

            if (error) throw error;

            // Local update
            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));
        } catch (err: any) {
            setActionMessage({ type: "error", text: "エラーが発生しました: " + (err.message || "不明なエラー") });
        } finally {
            setIsActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">エラーが発生しました</h2>
                    <p className="text-slate-500 mb-6">{error || "イベントが見つかりません"}</p>
                    <Link href="/">
                        <Button>ダッシュボードに戻る</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const rejectedCount = applications.filter(a => a.status === 'rejected').length;

    const statusLabel = event.status === 'published' ? "募集中" : event.status === 'closed' ? "募集終了" : "非公開";

    const bgColors = ['bg-emerald-100', 'bg-pink-100', 'bg-purple-100', 'bg-sky-100', 'bg-amber-100', 'bg-rose-100'];
    const textColors = ['text-emerald-700', 'text-pink-700', 'text-purple-700', 'text-sky-700', 'text-amber-700', 'text-rose-700'];

    function timeAgo(dateStr: string) {
        const now = new Date();
        const then = new Date(dateStr);
        const diffMs = now.getTime() - then.getTime();
        const diffH = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffH < 1) return "たった今";
        if (diffH < 24) return `${diffH}時間前`;
        const diffD = Math.floor(diffH / 24);
        if (diffD === 1) return "昨日";
        return `${diffD}日前`;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <main className="flex-1 max-w-5xl mx-auto py-8 px-6 w-full">
                {/* Action message toast */}
                {actionMessage && (
                    <div className={cn(
                        "mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between",
                        actionMessage.type === "error"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}>
                        <span>{actionMessage.text}</span>
                        <button onClick={() => setActionMessage(null)} className="ml-2 text-current opacity-60 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Back + Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="w-4 h-4" />
                        イベント一覧へ戻る
                    </Link>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDuplicate} className="text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-1.5">
                            <Copy className="w-4 h-4" />
                            複製
                        </button>
                        <button onClick={handleDelete} className="text-sm font-medium text-red-500 hover:text-red-600 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4" />
                            削除
                        </button>
                        <Link href={`/events/${eventId}/edit`}>
                            <button className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/20">
                                <Edit className="w-4 h-4" />
                                編集する
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Hero / Event Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
                    {/* Cover Image */}
                    <div className="h-48 relative">
                        {event.main_image_url ? (
                            <NextImage
                                src={event.main_image_url}
                                alt={event.event_name}
                                fill
                                sizes="(max-width: 768px) 100vw, 1152px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 flex items-center justify-center">
                                <ImageIcon className="w-16 h-16 text-orange-300" strokeWidth={1} />
                            </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <span className="h-7 inline-flex items-center justify-center px-3 rounded-full bg-white/90 backdrop-blur text-orange-700 text-xs font-bold shadow-sm" style={{ lineHeight: 1 }}>
                                {statusLabel}
                            </span>
                        </div>
                    </div>

                    {/* Event Info */}
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">{event.event_name}</h1>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mb-4">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                {event.event_start_date}{event.event_end_date && event.event_end_date !== event.event_start_date ? ` ~ ${event.event_end_date}` : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                {event.venue_name}
                            </span>
                            {event.event_time && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    {event.event_time}
                                </span>
                            )}
                            {event.genre && (
                                <span className="flex items-center gap-1.5">
                                    <Tag className="w-4 h-4 text-orange-500" />
                                    {event.genre}
                                </span>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex gap-3">
                            <div className="flex-1 bg-orange-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-orange-600">{applications.length}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">応募数</p>
                            </div>
                            <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">承認済み</p>
                            </div>
                            <div className="flex-1 bg-yellow-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">審査中</p>
                            </div>
                            <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">却下</p>
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-slate-700">{event.recruit_count || 0}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">募集枠</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Details (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Event Description */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                イベント概要
                            </h2>
                            {event.description ? (
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                            ) : (
                                <p className="text-sm text-slate-400">説明はまだ登録されていません。</p>
                            )}
                        </div>

                        {/* All Event Details */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-orange-500" />
                                イベント詳細
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">イベント名</span>
                                    <span className="text-slate-900 font-semibold">{event.event_name}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">開催開始日</span>
                                    <span className="text-slate-900 font-semibold">{event.event_start_date}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">開催終了日</span>
                                    <span className="text-slate-900 font-semibold">{event.event_end_date || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">開催時間</span>
                                    <span className="text-slate-900 font-semibold">{event.event_time || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">会場名</span>
                                    <span className="text-slate-900 font-semibold">{event.venue_name || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">住所</span>
                                    <span className="text-slate-900 font-semibold">{event.address || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">カテゴリ</span>
                                    <span className="text-slate-900 font-semibold">{event.genre || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <span className="text-slate-400 font-medium">カバー画像</span>
                                    <span className="text-slate-900 font-semibold">{event.main_image_url ? "設定済み" : "未設定"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Booth Conditions */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-orange-500" />
                                出店条件
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">出店料</span>
                                    <span className="text-slate-900 font-bold">{event.fee || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">募集枠数</span>
                                    <span className="text-slate-900 font-semibold">{event.recruit_count || "-"} ブース</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-slate-400 font-medium">承認済み / 募集枠</span>
                                    <span className="text-slate-900 font-semibold">{approvedCount} / {event.recruit_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar (1 col) */}
                    <div className="space-y-6">

                        {/* Status Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-5">ステータス</h3>

                            {/* Step 1: Completed */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="w-0.5 h-8 bg-emerald-300"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-semibold text-slate-900">イベント作成</p>
                                    <p className="text-xs text-slate-500 mt-0.5">完了</p>
                                </div>
                            </div>

                            {/* Step 2: Completed */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="w-0.5 h-8 bg-emerald-300"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-semibold text-slate-900">募集開始</p>
                                    <p className="text-xs text-slate-500 mt-0.5">完了</p>
                                </div>
                            </div>

                            {/* Step 3: Completed */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="w-0.5 h-8 bg-emerald-300"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-semibold text-slate-900">募集締切</p>
                                    <p className="text-xs text-slate-500 mt-0.5">完了</p>
                                </div>
                            </div>

                            {/* Step 4: Current */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <div className="w-0.5 h-8 bg-slate-200"></div>
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-semibold text-emerald-700">審査中</p>
                                    <p className="text-xs text-orange-600 font-medium mt-0.5">現在のステップ</p>
                                </div>
                            </div>

                            {/* Step 5: Upcoming */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">5</div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">イベント開催</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Applications */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-slate-900">最近の応募</h3>
                                <Link href={`/events/${eventId}/applications`} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                                    すべて見る
                                </Link>
                            </div>
                            {applications.length > 0 ? (
                                <div className="space-y-3">
                                    {applications.slice(0, 4).map((app, idx) => {
                                        const initial = app.exhibitor?.shop_name?.charAt(0) || app.exhibitor?.name?.charAt(0) || "?";
                                        const bgColor = bgColors[idx % bgColors.length];
                                        const txtColor = textColors[idx % textColors.length];
                                        const badgeClass = app.status === 'approved'
                                            ? "bg-emerald-100 text-emerald-700"
                                            : app.status === 'rejected'
                                                ? "bg-red-100 text-red-700"
                                                : "bg-yellow-100 text-yellow-700";
                                        const badgeLabel = app.status === 'approved' ? "承認済み" : app.status === 'rejected' ? "却下済み" : "審査中";

                                        return (
                                            <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold", bgColor, txtColor)}>
                                                    {initial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{app.exhibitor?.shop_name || "店舗名なし"}</p>
                                                    <p className="text-xs text-slate-400">{timeAgo(app.created_at)}</p>
                                                </div>
                                                <span className={cn("h-6 inline-flex items-center justify-center px-2 rounded-full text-[10px] font-bold", badgeClass)} style={{ lineHeight: 1 }}>
                                                    {badgeLabel}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4">まだ応募はありません</p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">クイックアクション</h3>
                            <div className="space-y-2">
                                <button onClick={handleShare} className="w-full text-left text-sm font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 px-3 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                                    <Share2 className="w-4 h-4 text-slate-400" />
                                    募集ページを共有
                                </button>
                                <button onClick={handleExportCSV} className="w-full text-left text-sm font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 px-3 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                                    <Download className="w-4 h-4 text-slate-400" />
                                    応募者リストをCSV出力
                                </button>
                                <Link href={`/events/${eventId}/edit`} className="w-full text-left text-sm font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 px-3 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    イベント設定
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
