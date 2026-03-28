import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    Calendar, MapPin, ChevronLeft,
    Clock, AlertTriangle, Phone, Mail, User, Store,
    FileText, Shield, Camera, XCircle, ChevronRight
} from "lucide-react";
import { ShareButton, BookmarkButton, HeroBookmarkButton } from "./EventActions";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Get event details with organizer info
    const { data: event, error } = await supabase
        .from("events")
        .select("*, organizers(*)")
        .eq("id", id)
        .single();

    if (error || !event) {
        return notFound();
    }

    // 2. Check if user is logged in
    let user = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (!error) {
            user = data.user;
        }
    } catch (error) {
        // Silently handle auth errors - user will be null
        console.error("Event detail page auth error:", error);
    }

    // 3. If logged in, check if already applied
    let hasApplied = false;
    let exhibitorProfile = null;

    if (user) {
        // Get exhibitor profile
        const { data: profiles } = await supabase
            .from("exhibitors")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

        exhibitorProfile = profiles?.[0] || null;

        if (exhibitorProfile) {
            const { data: application } = await supabase
                .from("event_applications")
                .select("id")
                .eq("event_id", id)
                .eq("exhibitor_id", exhibitorProfile.id)
                .single();

            if (application) hasApplied = true;
        }
    }

    // Derived values
    const recruitCount = event.recruit_count ?? 20;
    const appliedCount = event.applied_count ?? 0;
    const progressPercent = recruitCount > 0 ? Math.min((appliedCount / recruitCount) * 100, 100) : 0;
    const fee = event.fee ?? "未定";

    const venueRulesRaw = (event as Record<string, unknown>).venue_rules as string | string[] | null ?? null;
    const venueRules = Array.isArray(venueRulesRaw) ? venueRulesRaw : venueRulesRaw ? venueRulesRaw.split("\n").filter(Boolean) : null;
    const cancellationPolicy = (event as Record<string, unknown>).cancellation_policy as string | null ?? null;
    const postponeDate = (event as Record<string, unknown>).postpone_date as string | null ?? null;
    const boothCount = (event as Record<string, unknown>).booth_count as number | null ?? recruitCount;

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Back link */}
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-store-600 transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4" />
                    イベント検索に戻る
                </Link>

                {/* Hero Image */}
                <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-200 mb-8">
                    {event.main_image_url ? (
                        <Image
                            src={event.main_image_url}
                            alt={event.event_name}
                            fill
                            sizes="(max-width: 768px) 100vw, 1152px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-store-100 to-store-50">
                            <Calendar className="w-20 h-20 text-store-200" />
                        </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-store-600 text-white shadow-lg">
                            <Store className="w-3.5 h-3.5" />
                            募集中
                        </span>
                    </div>
                    {/* Bookmark button */}
                    <HeroBookmarkButton eventId={id} />
                </div>

                {/* Two-column layout */}
                <div className="flex gap-8">
                    {/* Left column - Main content */}
                    <div className="flex-1 space-y-6">
                        {/* Event title */}
                        <div>
                            {event.genre && (
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-store-100 text-store-700 mb-3">
                                    {event.genre}
                                </span>
                            )}
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                {event.event_name}
                            </h1>
                            {event.lead_text && (
                                <p className="mt-2 text-slate-500 leading-relaxed">
                                    {event.lead_text}
                                </p>
                            )}
                        </div>

                        {/* Key info cards - 2 col grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Date/time card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-store-100 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5 text-store-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 mb-1">開催日時</p>
                                        <p className="font-bold text-slate-900 text-sm">{event.event_start_date}</p>
                                        {event.event_time && (
                                            <p className="text-sm text-slate-500 mt-0.5">{event.event_time}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Location card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-store-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-store-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 mb-1">場所</p>
                                        <p className="font-bold text-slate-900 text-sm">{event.venue_name}</p>
                                        {event.address && (
                                            <p className="text-sm text-slate-500 mt-0.5">{event.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Postponement notice */}
                        {postponeDate && (
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-800 text-sm">延期のお知らせ</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        本イベントは <span className="font-bold">{postponeDate}</span> に延期となりました。
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 概要 section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                概要
                            </h2>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {event.description || "イベントの詳細情報は準備中です。"}
                            </div>
                        </div>

                        {/* 出店について section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                出店について
                            </h2>
                            <div className="text-slate-600 leading-relaxed text-sm mb-5">
                                {event.requirements || "出店に関する詳細情報は準備中です。"}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-xs font-medium text-slate-400 mb-1">募集区画数</p>
                                    <p className="text-lg font-bold text-slate-900">{boothCount}<span className="text-sm font-normal text-slate-500 ml-1">区画</span></p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-xs font-medium text-slate-400 mb-1">出店料</p>
                                    <p className="text-lg font-bold text-slate-900">{fee}</p>
                                </div>
                            </div>
                        </div>

                        {/* 会場内ルール section */}
                        {venueRules && venueRules.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                    会場内ルール
                                </h2>
                                <ol className="space-y-3">
                                    {venueRules.map((rule: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="leading-relaxed">{rule}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* 会場レイアウト section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                会場レイアウト
                            </h2>
                            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 h-48 flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">レイアウト図は準備中です</p>
                                </div>
                            </div>
                        </div>

                        {/* 出店規約 section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                出店規約
                            </h2>
                            <div className="space-y-6">
                                {/* 規約の履行 */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <FileText className="w-4 h-4 text-store-500" />
                                        規約の履行
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6">
                                        出店者は本規約に同意の上、申し込むものとします。規約に違反した場合、出店許可の取り消し及び今後のイベントへの参加をお断りする場合があります。
                                    </p>
                                </div>
                                {/* 出店資格 */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <Shield className="w-4 h-4 text-store-500" />
                                        出店資格
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6">
                                        食品を取り扱う場合は、保健所の営業許可証が必要です。その他関連する許認可をお持ちの方に限ります。
                                    </p>
                                </div>
                                {/* 肖像権 */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <Camera className="w-4 h-4 text-store-500" />
                                        肖像権
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6">
                                        イベント中に撮影した写真・動画は、主催者のSNS・Webサイト等で使用する場合があります。予めご了承ください。
                                    </p>
                                </div>
                                {/* キャンセルポリシー */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <XCircle className="w-4 h-4 text-store-500" />
                                        キャンセルポリシー
                                    </h3>
                                    {cancellationPolicy ? (
                                        <p className="text-sm text-slate-600 leading-relaxed pl-6 whitespace-pre-wrap">{cancellationPolicy}</p>
                                    ) : (
                                        <div className="pl-6">
                                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                                出店確定後のキャンセルには以下のキャンセル料が発生します。
                                            </p>
                                            <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200">
                                                            <th className="text-left px-4 py-2.5 font-medium text-slate-500 bg-slate-100">期間</th>
                                                            <th className="text-right px-4 py-2.5 font-medium text-slate-500 bg-slate-100">キャンセル料</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-slate-100">
                                                            <td className="px-4 py-2.5 text-slate-600">30日前まで</td>
                                                            <td className="px-4 py-2.5 text-right font-medium text-slate-900">無料</td>
                                                        </tr>
                                                        <tr className="border-b border-slate-100">
                                                            <td className="px-4 py-2.5 text-slate-600">29日〜15日前</td>
                                                            <td className="px-4 py-2.5 text-right font-medium text-slate-900">出店料の30%</td>
                                                        </tr>
                                                        <tr className="border-b border-slate-100">
                                                            <td className="px-4 py-2.5 text-slate-600">14日〜8日前</td>
                                                            <td className="px-4 py-2.5 text-right font-medium text-slate-900">出店料の50%</td>
                                                        </tr>
                                                        <tr className="border-b border-slate-100">
                                                            <td className="px-4 py-2.5 text-slate-600">7日〜2日前</td>
                                                            <td className="px-4 py-2.5 text-right font-medium text-slate-900">出店料の80%</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="px-4 py-2.5 text-slate-600">前日〜当日</td>
                                                            <td className="px-4 py-2.5 text-right font-bold text-red-600">出店料の100%</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 会場アクセス section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                会場アクセス
                            </h2>
                            <div className="mb-3">
                                <p className="text-sm font-medium text-slate-800">{event.venue_name}</p>
                                {event.address && (
                                    <p className="text-sm text-slate-500 mt-1">{event.address}</p>
                                )}
                            </div>
                            <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 h-48 flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">地図は準備中です</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="w-80 shrink-0">
                        <div className="sticky top-24 space-y-4">

                            {/* Apply CTA card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                {/* Fee display */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-slate-400 mb-1">出店料</p>
                                    <p className="text-2xl font-bold text-slate-900">{fee}</p>
                                </div>

                                {/* Recruitment progress */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-slate-500">募集状況</span>
                                        <span className="font-bold text-slate-900">{appliedCount}<span className="text-slate-400 font-normal">/{recruitCount}区画</span></span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-store-500 rounded-full transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* CTA button - state dependent */}
                                {hasApplied ? (
                                    <button
                                        disabled
                                        className="w-full h-12 rounded-xl text-sm font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                                    >
                                        すでに申し込み済みです
                                    </button>
                                ) : !user ? (
                                    <Link href="/login" className="block">
                                        <button className="w-full h-12 rounded-xl text-sm font-bold bg-store-500 text-white hover:bg-store-600 transition-colors shadow-sm shadow-store-500/20 flex items-center justify-center gap-2">
                                            ログインして申し込む
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                ) : !exhibitorProfile ? (
                                    <Link href="/onboarding" className="block">
                                        <button className="w-full h-12 rounded-xl text-sm font-bold bg-store-500 text-white hover:bg-store-600 transition-colors shadow-sm shadow-store-500/20 flex items-center justify-center gap-2">
                                            プロフィール作成へ
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                ) : (
                                    <Link href={`/events/${id}/apply`} className="block">
                                        <button className="w-full h-12 rounded-xl text-sm font-bold bg-store-500 text-white hover:bg-store-600 transition-colors shadow-sm shadow-store-500/20 flex items-center justify-center gap-2">
                                            出店を申し込む
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                )}

                                {/* Deadline notice */}
                                {event.application_period_end && (
                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>募集締切: {event.application_period_end}</span>
                                    </div>
                                )}
                            </div>

                            {/* Organizer card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">主催者情報</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                                        {event.organizers?.company_name?.[0] ?? <User className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{event.organizers?.company_name ?? "主催者"}</p>
                                        {event.organizers?.name && (
                                            <p className="text-xs text-slate-500 truncate">{event.organizers.name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {event.organizers?.email && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="truncate">{event.organizers.email}</span>
                                        </div>
                                    )}
                                    {event.organizers?.phone && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>{event.organizers.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Share & Bookmark buttons */}
                            <div className="flex gap-3">
                                <ShareButton />
                                <BookmarkButton eventId={id} />
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
