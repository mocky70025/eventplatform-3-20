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

    // Per-day settings
    const daySettingsRaw = (event as Record<string, unknown>).event_day_settings;
    const daySettings: Array<{ date: string; recruit_count: number; fee: string; notes: string }> = (() => {
        try {
            const parsed = daySettingsRaw ? (typeof daySettingsRaw === "string" ? JSON.parse(daySettingsRaw) : daySettingsRaw) : null;
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
        } catch { return []; }
    })();

    const venueRulesRaw = (event as Record<string, unknown>).venue_rules as string | string[] | null ?? null;
    const venueRules = Array.isArray(venueRulesRaw) ? venueRulesRaw : venueRulesRaw ? venueRulesRaw.split("\n").filter(Boolean) : null;
    const cancelPolicy = (event as Record<string, unknown>).cancel_policy as string | null ?? null;
    const termsCompliance = (event as Record<string, unknown>).terms_compliance as string | null ?? null;
    const boothQualification = (event as Record<string, unknown>).booth_qualification as string | null ?? null;
    const privacyPolicy = (event as Record<string, unknown>).privacy_policy as string | null ?? null;
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

                {/* Private event banner */}
                {event.visibility === "private" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-800">限定公開イベント</p>
                            <p className="text-xs text-amber-600">招待リンクからアクセスしています。このイベントは検索結果には表示されません。</p>
                        </div>
                    </div>
                )}

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
                    {/* Bookmark button (hide for private events) */}
                    {event.visibility !== "private" && <HeroBookmarkButton eventId={id} />}
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
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-400 mb-1">開催日時</p>
                                        {(() => {
                                            const schedule = event.event_schedule;
                                            const parsed = schedule ? (typeof schedule === "string" ? JSON.parse(schedule) : schedule) : null;
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                return (
                                                    <div className="space-y-1">
                                                        {parsed.map((day: { date: string; start_time: string; end_time: string }) => (
                                                            <div key={day.date} className="flex items-center gap-2 text-sm">
                                                                <span className="font-bold text-slate-900">{new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}</span>
                                                                <span className="text-slate-500">{day.start_time} 〜 {day.end_time}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <>
                                                    <p className="font-bold text-slate-900 text-sm">{event.event_start_date}</p>
                                                    {event.event_time && (
                                                        <p className="text-sm text-slate-500 mt-0.5">{event.event_time}</p>
                                                    )}
                                                </>
                                            );
                                        })()}
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
                        {(() => {
                            const postponedDatesRaw = (event as any).postponed_dates;
                            const postponedDates = postponedDatesRaw ? (typeof postponedDatesRaw === 'string' ? JSON.parse(postponedDatesRaw) : postponedDatesRaw) : null;
                            const postponedNote = (event as any).postponed_note as string | null;
                            const hasPostponement = postponeDate || (postponedDates && Array.isArray(postponedDates) && postponedDates.length > 0);
                            if (!hasPostponement) return null;
                            return (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">延期のお知らせ{postponedNote && ` (${postponedNote})`}</p>
                                        {postponeDate && !postponedDates && (
                                            <p className="text-sm text-amber-700 mt-1">
                                                本イベントは <span className="font-bold">{postponeDate}</span> に延期となりました。
                                            </p>
                                        )}
                                        {postponedDates && Array.isArray(postponedDates) && postponedDates.length > 0 && (
                                            <div className="mt-1 space-y-1">
                                                {postponedDates.map((d: any) => (
                                                    <p key={d.date} className="text-sm text-amber-700">
                                                        {new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} → <span className="font-bold">{d.postponed_to}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

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

                            {/* 日別条件 */}
                            {(() => {
                                const daySettings = event.event_day_settings;
                                const parsed = daySettings ? (typeof daySettings === "string" ? JSON.parse(daySettings) : daySettings) : null;
                                if (!Array.isArray(parsed) || parsed.length === 0) return null;
                                return (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">日別の条件</p>
                                        <div className="space-y-2">
                                            {parsed.map((day: { date: string; recruit_count: number; fee: string; notes: string }) => (
                                                <div key={day.date} className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 text-sm">
                                                    <span className="font-bold text-slate-700 min-w-[80px]">{new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}</span>
                                                    <span className="text-slate-600">{day.recruit_count}区画</span>
                                                    <span className="text-slate-600">{day.fee || fee}</span>
                                                    {day.notes && <span className="text-slate-400 text-xs">{day.notes}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
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
                        {(event as Record<string, unknown>).venue_layout_url ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-store-500 rounded-full"></span>
                                    会場レイアウト
                                </h2>
                                <div className="rounded-lg overflow-hidden border border-slate-200">
                                    <img
                                        src={(event as Record<string, unknown>).venue_layout_url as string}
                                        alt="会場レイアウト"
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        ) : null}

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
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6 whitespace-pre-wrap">
                                        {termsCompliance || "出店者は本規約に同意の上、申し込むものとします。規約に違反した場合、出店許可の取り消し及び今後のイベントへの参加をお断りする場合があります。"}
                                    </p>
                                </div>
                                {/* 出店資格 */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <Shield className="w-4 h-4 text-store-500" />
                                        出店資格
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6 whitespace-pre-wrap">
                                        {boothQualification || "食品を取り扱う場合は、保健所の営業許可証が必要です。その他関連する許認可をお持ちの方に限ります。"}
                                    </p>
                                </div>
                                {/* 肖像権・個人情報 */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <Camera className="w-4 h-4 text-store-500" />
                                        肖像権・個人情報の取り扱い
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed pl-6 whitespace-pre-wrap">
                                        {privacyPolicy || "イベント中に撮影した写真・動画は、主催者のSNS・Webサイト等で使用する場合があります。予めご了承ください。"}
                                    </p>
                                </div>
                                {/* キャンセルポリシー */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                                        <XCircle className="w-4 h-4 text-store-500" />
                                        キャンセルポリシー
                                    </h3>
                                    {cancelPolicy ? (
                                        <p className="text-sm text-slate-600 leading-relaxed pl-6 whitespace-pre-wrap">{cancelPolicy}</p>
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
                            {event.address ? (
                                <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video">
                                    <iframe
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed&z=15`}
                                        className="w-full h-full border-0"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="会場の地図"
                                    />
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 h-48 flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">住所が設定されていません</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="w-80 shrink-0">
                        <div className="sticky top-24 space-y-4">

                            {/* Apply CTA card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                {daySettings.length > 0 ? (
                                    <div className="mb-5 space-y-3">
                                        {daySettings.map((day) => (
                                            <div key={day.date} className="bg-slate-50 rounded-lg p-3">
                                                <p className="text-xs font-bold text-slate-700 mb-1.5">
                                                    {new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                                                </p>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">出店料</span>
                                                    <span className="font-bold text-slate-900">{day.fee || fee}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm mt-1">
                                                    <span className="text-slate-500">募集枠</span>
                                                    <span className="font-bold text-slate-900">{day.recruit_count}区画</span>
                                                </div>
                                                {day.notes && <p className="text-xs text-slate-400 mt-1">{day.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}

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
                                {event.organizers?.email && (
                                    <a
                                        href={`mailto:${event.organizers.email}?subject=${encodeURIComponent(`【${event.event_name}】に関するお問い合わせ`)}`}
                                        className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-store-200 text-store-700 hover:bg-store-50 text-sm font-medium transition"
                                    >
                                        <Mail className="w-4 h-4" />
                                        お問い合わせ
                                    </a>
                                )}
                            </div>

                            {/* Share & Bookmark buttons */}
                            <div className="flex gap-3">
                                <ShareButton />
                                {event.visibility !== "private" && <BookmarkButton eventId={id} />}
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
