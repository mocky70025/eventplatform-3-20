"use client";

import { useState } from "react";
import { AlertCircle, Search, X, Mail, Phone } from "lucide-react";

interface Organizer {
    id: string;
    company_name: string;
    name: string;
    email: string;
    phone_number: string;
    created_at: string;
}

export function OrganizerRow({ organizer }: { organizer: Organizer }) {
    return (
        <tr
            id={`org-${organizer.id}`}
            className="hover:bg-slate-50/70 transition-colors scroll-mt-20"
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {(organizer.company_name || organizer.name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">{organizer.company_name || "個人"}</span>
                        <span className="text-xs text-slate-500">{organizer.name}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" />{organizer.email}</span>
                    {organizer.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" />{organizer.phone_number}</span>}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                {new Date(organizer.created_at).toLocaleDateString('ja-JP')}
            </td>
        </tr>
    );
}

export default function OrganizerList({ organizers }: { organizers: Organizer[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = organizers.filter(org => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || (org.company_name || "").toLowerCase().includes(q)
            || (org.name || "").toLowerCase().includes(q)
            || (org.email || "").toLowerCase().includes(q);
        return matchesSearch;
    });

    return (
        <div className="space-y-4">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="会社名・担当者名・メールで検索"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">
                        {searchQuery ? `"${searchQuery}" に一致する主催者はいません` : "該当する主催者はいません"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 font-medium">
                        {filtered.length} 件表示
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">会社名 / 担当者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">連絡先</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">登録日</th>
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
