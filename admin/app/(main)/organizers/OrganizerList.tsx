"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Check, Loader2, AlertCircle, Search, X, Mail, Phone, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Organizer {
    id: string;
    company_name: string;
    name: string;
    email: string;
    phone_number: string;
    is_approved: boolean;
    created_at: string;
}

export function OrganizerRow({ organizer: initialOrganizer }: { organizer: Organizer }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [organizer, setOrganizer] = useState(initialOrganizer);
    const [errorMessage, setErrorMessage] = useState("");
    const [isStaleGuard, setIsStaleGuard] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isStaleGuard) setOrganizer(initialOrganizer);
    }, [initialOrganizer, isStaleGuard]);

    const handleToggleApproval = async () => {
        setIsUpdating(true);
        setErrorMessage("");
        const previousState = organizer.is_approved;
        try {
            const newApprovalStatus = !organizer.is_approved;
            setOrganizer(prev => ({ ...prev, is_approved: newApprovalStatus }));
            setIsStaleGuard(true);

            const response = await fetch('/api/organizers/update-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizerId: organizer.id, isApproved: newApprovalStatus }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || '更新に失敗しました');
            if (result.organizer) setOrganizer(prev => ({ ...prev, is_approved: result.organizer.is_approved }));
            router.refresh();
            setTimeout(() => setIsStaleGuard(false), 1500);
        } catch (err: any) {
            setErrorMessage(err.message || "不明なエラー");
            setOrganizer(prev => ({ ...prev, is_approved: previousState }));
            setIsStaleGuard(false);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <tr
            id={`org-${organizer.id}`}
            className={`hover:bg-slate-50/70 transition-colors scroll-mt-20 ${!organizer.is_approved ? 'bg-yellow-50/30' : ''}`}
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {(organizer.company_name || organizer.name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">{organizer.company_name || "個人"}</span>
                        <span className="text-xs text-slate-500">{organizer.name}</span>
                        {errorMessage && <span className="text-xs text-red-600 mt-0.5">{errorMessage}</span>}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{organizer.email}</span>
                    {organizer.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{organizer.phone_number}</span>}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                {new Date(organizer.created_at).toLocaleDateString('ja-JP')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${organizer.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {organizer.is_approved ? "承認済み" : "未承認"}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <Button
                    size="sm"
                    variant={organizer.is_approved ? "outline" : "primary"}
                    onClick={handleToggleApproval}
                    disabled={isUpdating}
                    className={!organizer.is_approved ? "bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs font-bold" : "h-8 text-xs text-slate-500"}
                >
                    {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : organizer.is_approved ? (
                        "承認解除"
                    ) : (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" />承認する</span>
                    )}
                </Button>
            </td>
        </tr>
    );
}

export default function OrganizerList({ organizers }: { organizers: Organizer[] }) {
    const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const pendingCount = organizers.filter(o => !o.is_approved).length;
    const approvedCount = organizers.filter(o => o.is_approved).length;

    const filtered = organizers.filter(org => {
        const matchesFilter =
            filter === "all" ||
            (filter === "pending" && !org.is_approved) ||
            (filter === "approved" && org.is_approved);
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || (org.company_name || "").toLowerCase().includes(q)
            || (org.name || "").toLowerCase().includes(q)
            || (org.email || "").toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const tabs = [
        { key: "all", label: "すべて", count: organizers.length },
        { key: "pending", label: "未承認", count: pendingCount },
        { key: "approved", label: "承認済み", count: approvedCount },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="会社名・担当者名・メールで検索"
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

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === tab.key
                                ? "bg-white/20 text-white"
                                : tab.key === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {searchQuery ? `"${searchQuery}" に一致する主催者はいません` : "該当する主催者はいません"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-400 font-medium">
                        {filtered.length} 件表示
                        {filter !== "all" && <span className="ml-1">（全 {organizers.length} 件中）</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">会社名 / 担当者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">連絡先</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">登録日</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ステータス</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((org) => (
                                    <OrganizerRow key={org.id} organizer={org} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
