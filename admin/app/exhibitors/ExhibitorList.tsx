"use client";

import { AlertCircle, Store, Mail, Phone } from "lucide-react";

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
    if (!exhibitors || exhibitors.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">出店者がまだ登録されていません</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-50">
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">店舗名 / 担当者</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">連絡先</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ジャンル</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">登録日</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {exhibitors.map((exhibitor) => (
                            <tr key={exhibitor.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                            <Store className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{exhibitor.shop_name || "未設定"}</span>
                                            <span className="text-xs text-slate-500">{exhibitor.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-slate-400" />
                                            {exhibitor.email}
                                        </span>
                                        {exhibitor.phone_number && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {exhibitor.phone_number}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {exhibitor.genre ? (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>
                                            {exhibitor.genre}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-300">未設定</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                                    {new Date(exhibitor.created_at).toLocaleDateString('ja-JP')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
