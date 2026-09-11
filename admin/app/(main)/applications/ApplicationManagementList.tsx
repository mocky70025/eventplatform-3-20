"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Check, X, Loader2, AlertCircle, Calendar, MapPin, Search, X as XIcon,
    Building2, Store, Shield, Mail, Phone, ChevronDown, ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Application {
    id: string;
    status: string;
    message: string;
    created_at: string;
    event: {
        id: string;
        event_name: string;
        status: string;
        genre: string;
        event_start_date: string;
        venue_name: string;
        organizer_id: string;
        organizer: {
            company_name: string;
            name: string;
            email: string;
        };
    };
    exhibitor: {
        shop_name: string;
        name: string;
        email: string;
        phone_number: string;
        genre: string;
    };
}

const STATUS_LABELS: Record<string, string> = {
    pending: "審査中",
    approved: "承認済み",
    rejected: "却下済み",
    cancelled: "キャンセル済み",
};

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
};

export default function ApplicationManagementList({ applications }: { applications: Application[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [eventFilter, setEventFilter] = useState("all");
    const router = useRouter();

    const statuses = ["all", ...new Set(applications.map(a => a.status).filter(Boolean))];
    const events = ["all", ...new Set(applications.map(a => a.event?.event_name).filter(Boolean))];

    const filtered = applications.filter(app => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || app.event?.event_name?.toLowerCase().includes(q)
            || app.exhibitor?.shop_name?.toLowerCase().includes(q)
            || app.exhibitor?.name?.toLowerCase().includes(q)
            || app.exhibitor?.email?.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        const matchesEvent = eventFilter === "all" || app.event?.event_name === eventFilter;
        return matchesSearch && matchesStatus && matchesEvent;
    });

    const handleStatusChange = async (applicationId: string, newStatus: string) => {
        if (newStatus === 'cancelled') {
            if (!confirm("管理者権限でこの申請をキャンセルしますか？")) return;
        }
        try {
            const response = await fetch('/api/admin/applications/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, status: newStatus }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'エラーが発生しました');
            }
            router.refresh();
        } catch (err: any) {
            alert("エラーが発生しました: " + (err.message || "不明なエラー"));
        }
    };

    if (!applications || applications.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">申請がまだありません</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="イベント名・店舗名・担当者名・メールで検索"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                            <XIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white w-auto"
                >
                    {statuses.map(s => <option key={s} value={s}>{s === "all" ? "すべてのステータス" : STATUS_LABELS[s] || s}</option>)}
                </select>
                <select
                    value={eventFilter}
                    onChange={e => setEventFilter(e.target.value)}
                    className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white w-auto max-w-[200px]"
                >
                    {events.map(e => <option key={e} value={e}>{e === "all" ? "すべてのイベント" : e}</option>)}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">
                        {searchQuery ? `"${searchQuery}" に一致する申請はありません` : "該当する申請はありません"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 font-medium">
                        {filtered.length} 件表示
                        {applications.length > filtered.length && <span className="ml-1">（全 {applications.length} 件中）</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">申請日</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">イベント</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">出店者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">主催者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">ステータス</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(app.created_at).toLocaleDateString('ja-JP', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-slate-900 truncate">{app.event?.event_name}</span>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{app.event?.event_start_date}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.event?.venue_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm font-bold shrink-0">
                                                        {(app.exhibitor?.shop_name || "?").charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-900 truncate">{app.exhibitor?.shop_name || "未設定"}</span>
                                                        <span className="text-xs text-slate-500">{app.exhibitor?.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.exhibitor?.email}</span>
                                                    {app.exhibitor?.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.exhibitor?.phone_number}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 text-sm font-bold shrink-0">
                                                    {(app.event?.organizer?.company_name || "?").charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 truncate">{app.event?.organizer?.company_name}</span>
                                                    <span className="text-xs text-slate-500">{app.event?.organizer?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"}`}>
                                                {STATUS_LABELS[app.status] || app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {app.status === 'pending' ? (
                                                    <>
                                                        <Button size="sm" onClick={() => handleStatusChange(app.id, 'approved')} className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 text-xs font-bold">
                                                            <Check className="w-3 h-3 mr-1" />承認
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(app.id, 'rejected')} className="h-8 text-xs text-red-500 hover:bg-red-50 font-bold border-red-200">
                                                            却下
                                                        </Button>
                                                    </>
                                                ) : app.status === 'approved' ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(app.id, 'cancelled')} className="h-8 text-xs text-slate-500 hover:bg-red-50 hover:text-red-500 border-red-200">
                                                        <X className="w-3 h-3 mr-1" />取消
                                                    </Button>
                                                ) : app.status === 'rejected' ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(app.id, 'pending')} className="h-8 text-xs text-blue-500 hover:bg-blue-50 font-bold border-blue-200">
                                                        <ChevronDown className="w-3 h-3 mr-1" />再審査
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}