"use client";

import { useState } from "react";
import { AlertCircle, Store, Mail, Phone, Search, X } from "lucide-react";

interface Exhibitor {
    id: string;
    shop_name: string;
    name: string;
    email: string;
    phone_number: string;
    genre: string;
    created_at: string;
}

export default function ExhibitorList({ exhibitors }: { exhibitors: Exhibitor[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = exhibitors.filter(ex => {
        const q = searchQuery.toLowerCase();
        return !q
            || (ex.shop_name || "").toLowerCase().includes(q)
            || (ex.name || "").toLowerCase().includes(q)
            || (ex.email || "").toLowerCase().includes(q)
            || (ex.genre || "").toLowerCase().includes(q);
    });

    if (!exhibitors || exhibitors.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">出店者がまだ登録されていません</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="店舗名・担当者名・メール・ジャンルで検索"
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

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">"{searchQuery}" に一致する出店者はいません</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 font-medium">
                        {filtered.length} 件表示
                        {searchQuery && <span className="ml-1">（全 {exhibitors.length} 件中）</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">店舗名 / 担当者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">連絡先</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">ジャンル</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">登録日</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((exhibitor) => (
                                    <tr key={exhibitor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                                    <Store className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 truncate">{exhibitor.shop_name || "未設定"}</span>
                                                    <span className="text-xs text-slate-500">{exhibitor.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-xs text-slate-600">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" />{exhibitor.email}</span>
                                                {exhibitor.phone_number && (
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" />{exhibitor.phone_number}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {exhibitor.genre ? (
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                                    {exhibitor.genre}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500">未設定</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(exhibitor.created_at).toLocaleDateString('ja-JP')}
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
