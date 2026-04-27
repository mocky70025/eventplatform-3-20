"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Check, X, Loader2, AlertCircle, Calendar, MapPin, ChevronDown, ChevronUp,
    Tag, FileText, Building2, Shield, Truck, Phone, Mail, Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Event {
    id: string;
    event_name: string;
    status: string;
    genre: string;
    description: string;
    booth_content: string;
    event_start_date: string;
    event_end_date: string;
    event_time: string;
    postponed_date: string;
    postponed_dates: string;
    postponed_note: string;
    event_schedule: string;
    event_day_settings: string;
    application_period_end: string;
    venue_name: string;
    address: string;
    recruit_count: number;
    fee: string;
    venue_rules: string;
    loading_info: string;
    main_image_url: string;
    venue_layout_url: string;
    terms_compliance: string;
    booth_qualification: string;
    privacy_policy: string;
    cancel_policy: string;
    organizer_name: string;
    organizer_email: string;
    organizer_phone: string;
    created_at: string;
    organizer_id: string;
    organizer: {
        company_name: string;
        name: string;
        email: string;
        phone_number: string;
        is_approved: boolean;
    };
}

const STATUS_LABELS: Record<string, string> = {
    pending: "承認待ち",
    published: "公開中",
    rejected: "却下",
    draft: "非公開",
    closed: "募集終了",
    ended: "終了",
};

const STATUS_TABS = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "承認待ち" },
    { key: "published", label: "公開中" },
    { key: "rejected", label: "却下" },
    { key: "draft", label: "非公開" },
];

function InfoGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}

function InfoItem({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
    if (!value) return null;
    return (
        <div className={full ? "col-span-2" : ""}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{value}</p>
        </div>
    );
}

function TextBlock({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
    if (!value) return null;
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {icon} {label}
            </h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap bg-white rounded-xl p-4 border border-slate-100 max-h-40 overflow-y-auto">
                {value}
            </p>
        </div>
    );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            {icon} {children}
        </h4>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        published: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        rejected: "bg-red-100 text-red-700",
        closed: "bg-slate-200 text-slate-600",
        ended: "bg-slate-200 text-slate-500",
        draft: "bg-slate-100 text-slate-600",
    };
    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export function EventRow({ event }: { event: Event }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();

    const handleToggleStatus = async (newStatus: string) => {
        if (newStatus === 'deleted') {
            if (!confirm("本当にこのイベントを削除しますか？")) return;
        }
        setIsUpdating(true);
        try {
            const action = newStatus === 'deleted' ? 'delete' : newStatus;
            const response = await fetch('/api/events/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: event.id, action }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'エラーが発生しました');
            }
            router.refresh();
        } catch (err: any) {
            alert("エラーが発生しました: " + (err.message || "不明なエラー"));
        } finally {
            setIsUpdating(false);
        }
    };

    const actionButtons = (
        <div className="flex gap-2">
            {event.status === 'pending' ? (
                <>
                    <Button size="sm" onClick={() => handleToggleStatus('published')} disabled={isUpdating} className="bg-green-600 text-white hover:bg-green-700 h-8 text-xs font-bold">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />承認</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleStatus('rejected')} disabled={isUpdating} className="h-8 text-xs text-red-500 hover:bg-red-50 font-bold border-red-200">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "却下"}
                    </Button>
                </>
            ) : event.status === 'published' ? (
                <Button size="sm" variant="outline" onClick={() => handleToggleStatus('draft')} disabled={isUpdating} className="h-8 text-xs text-slate-500">
                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "非公開にする"}
                </Button>
            ) : (
                <Button size="sm" onClick={() => handleToggleStatus('published')} disabled={isUpdating} className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs font-bold">
                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "公開許可"}
                </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleToggleStatus('deleted')} disabled={isUpdating} className="h-8 text-xs text-red-400 hover:text-red-600 hover:bg-red-50">
                <X className="w-3 h-3" />
            </Button>
        </div>
    );

    return (
        <>
            <tr
                id={`event-${event.id}`}
                className={`hover:bg-slate-50/70 transition-colors scroll-mt-20 cursor-pointer ${event.status === 'pending' ? 'bg-yellow-50/30' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">{event.event_name}</span>
                            <span className="text-xs text-slate-400 mt-0.5">
                                {event.organizer?.company_name || event.organizer?.name}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {event.event_start_date}
                            {event.event_end_date && event.event_end_date !== event.event_start_date && ` ~ ${event.event_end_date}`}
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {event.venue_name}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={event.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    {actionButtons}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={4} className="px-0 py-0">
                        <div className="bg-slate-50/80 border-y border-slate-100 px-8 py-6 space-y-6">
                            <div className="grid grid-cols-[280px_1fr] gap-8">
                                <div className="space-y-3">
                                    {event.main_image_url ? (
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">メイン画像</p>
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                <Image src={event.main_image_url} alt={event.event_name} fill className="object-cover" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">メイン画像</p>
                                            <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center">
                                                <p className="text-xs text-slate-400">画像なし</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.venue_layout_url && (
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">会場レイアウト</p>
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                <Image src={event.venue_layout_url} alt="会場レイアウト" fill className="object-contain" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <SectionHeading icon={<FileText className="w-3.5 h-3.5" />}>イベント基本情報</SectionHeading>
                                        <InfoGrid>
                                            <InfoItem label="ジャンル" value={event.genre} />
                                            <InfoItem label="開催時間" value={event.event_time} />
                                            <InfoItem label="開催日" value={
                                                event.event_end_date && event.event_end_date !== event.event_start_date
                                                    ? `${event.event_start_date} ~ ${event.event_end_date}`
                                                    : event.event_start_date
                                            } />
                                            <InfoItem label="予備日" value={(() => {
                                                const pd = event.postponed_dates;
                                                const parsed = pd ? (typeof pd === 'string' ? JSON.parse(pd) : pd) : null;
                                                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                                                    return parsed.map((d: any) => `${new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}→${d.postponed_to}`).join("、");
                                                }
                                                return event.postponed_date;
                                            })()} />
                                            {event.postponed_note && <InfoItem label="延期備考" value={event.postponed_note} />}
                                            <InfoItem label="応募締切" value={event.application_period_end} />
                                            <InfoItem label="申請日" value={event.created_at ? new Date(event.created_at).toLocaleDateString("ja-JP") : null} />
                                            <InfoItem label="会場名" value={event.venue_name} />
                                            <InfoItem label="募集出店数" value={event.recruit_count ? `${event.recruit_count} 店舗` : null} />
                                            <InfoItem label="住所" value={event.address} full />
                                            <InfoItem label="出店料" value={event.fee} full />
                                            {(() => {
                                                const schedule = event.event_schedule;
                                                const parsed = schedule ? (typeof schedule === 'string' ? JSON.parse(schedule) : schedule) : null;
                                                if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;
                                                return <InfoItem label="日別スケジュール" value={parsed.map((d: any) => `${new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} ${d.start_time}〜${d.end_time}`).join("、")} full />;
                                            })()}
                                            {(() => {
                                                const settings = event.event_day_settings;
                                                const parsed = settings ? (typeof settings === 'string' ? JSON.parse(settings) : settings) : null;
                                                if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;
                                                return <InfoItem label="日別募集条件" value={parsed.map((d: any) => `${new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} ${d.recruit_count}店/${d.fee}`).join("、")} full />;
                                            })()}
                                        </InfoGrid>
                                    </div>
                                    <div>
                                        <SectionHeading icon={<Building2 className="w-3.5 h-3.5" />}>主催者情報</SectionHeading>
                                        <div className="bg-white rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                                                    {(event.organizer?.company_name || event.organizer?.name || "?").charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {event.organizer?.company_name || event.organizer?.name}
                                                        </p>
                                                        {event.organizer?.is_approved ? (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">認証済み</span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">未認証</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                        {event.organizer?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{event.organizer.email}</span>}
                                                        {event.organizer?.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{event.organizer.phone_number}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">イベント担当者</p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                                        {event.organizer_name && <span>{event.organizer_name}</span>}
                                                        {event.organizer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{event.organizer_email}</span>}
                                                        {event.organizer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{event.organizer_phone}</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <TextBlock label="イベント説明" value={event.description} icon={<FileText className="w-3.5 h-3.5" />} />
                                <TextBlock label="出店内容" value={event.booth_content} icon={<Tag className="w-3.5 h-3.5" />} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <TextBlock label="会場ルール" value={event.venue_rules} icon={<Shield className="w-3.5 h-3.5" />} />
                                <TextBlock label="搬入・搬出情報" value={event.loading_info} icon={<Truck className="w-3.5 h-3.5" />} />
                            </div>
                            {(event.terms_compliance || event.booth_qualification || event.privacy_policy || event.cancel_policy) && (
                                <div>
                                    <SectionHeading icon={<Shield className="w-3.5 h-3.5" />}>規約・ポリシー</SectionHeading>
                                    <div className="grid grid-cols-2 gap-4">
                                        {event.terms_compliance && (
                                            <div className="bg-white rounded-xl p-4 border border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">規約の履行</p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">{event.terms_compliance}</p>
                                            </div>
                                        )}
                                        {event.booth_qualification && (
                                            <div className="bg-white rounded-xl p-4 border border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">出店資格</p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">{event.booth_qualification}</p>
                                            </div>
                                        )}
                                        {event.cancel_policy && (
                                            <div className="bg-white rounded-xl p-4 border border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">キャンセルポリシー</p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">{event.cancel_policy}</p>
                                            </div>
                                        )}
                                        {event.privacy_policy && (
                                            <div className="bg-white rounded-xl p-4 border border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">プライバシーポリシー</p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-28 overflow-y-auto">{event.privacy_policy}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end pt-2 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                                {actionButtons}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function EventList({ events }: { events: Event[] }) {
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const counts = STATUS_TABS.reduce((acc, tab) => {
        acc[tab.key] = tab.key === "all"
            ? events.length
            : events.filter(e => e.status === tab.key).length;
        return acc;
    }, {} as Record<string, number>);

    const filtered = events.filter(event => {
        const matchesStatus = activeFilter === "all" || event.status === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || event.event_name.toLowerCase().includes(q)
            || (event.organizer?.company_name || "").toLowerCase().includes(q)
            || (event.organizer?.name || "").toLowerCase().includes(q)
            || (event.venue_name || "").toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-4">
            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="イベント名・主催者名・会場名で検索"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeFilter === tab.key
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeFilter === tab.key
                                ? "bg-white/20 text-white"
                                : tab.key === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                {counts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {searchQuery ? `"${searchQuery}" に一致するイベントはありません` : "該当するイベントはありません"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-400 font-medium">
                        {filtered.length} 件表示
                        {activeFilter !== "all" && <span className="ml-1">（全 {events.length} 件中）</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">イベント名 / 主催者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">日程 / 場所</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ステータス</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((event) => (
                                    <EventRow key={event.id} event={event} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
