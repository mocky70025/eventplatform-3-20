"use client";

import { useState } from "react";
import { AlertCircle, Search, X, User, Shield, Database, Trash2, Edit2, ExternalLink } from "lucide-react";

interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: string;
    details: Record<string, any>;
    created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    create: <Database className="w-3.5 h-3.5 text-green-600" />,
    update: <Edit2 className="w-3.5 h-3.5 text-blue-600" />,
    delete: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
    publish: <Shield className="w-3.5 h-3.5 text-purple-600" />,
    unpublish: <Shield className="w-3.5 h-3.5 text-amber-600" />,
    approve: <Shield className="w-3.5 h-3.5 text-emerald-600" />,
    reject: <Shield className="w-3.5 h-3.5 text-rose-600" />,
    suspend: <User className="w-3.5 h-3.5 text-red-600" />,
    unsuspend: <User className="w-3.5 h-3.5 text-green-600" />,
};

const ACTION_LABELS: Record<string, string> = {
    create: "作成",
    update: "更新",
    delete: "削除",
    publish: "公開",
    unpublish: "非公開",
    approve: "承認",
    reject: "却下",
    suspend: "停止",
    unsuspend: "再開",
};

const TARGET_ICONS: Record<string, React.ReactNode> = {
    event: <Database className="w-3.5 h-3.5 text-blue-500" />,
    organizer: <User className="w-3.5 h-3.5 text-purple-500" />,
    exhibitor: <User className="w-3.5 h-3.5 text-emerald-500" />,
    application: <Shield className="w-3.5 h-3.5 text-amber-500" />,
};

export default function AuditLogList({ logs }: { logs: AuditLog[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [targetFilter, setTargetFilter] = useState("all");

    const actions = ["all", ...new Set(logs.map(l => l.action).filter(Boolean))];
    const targets = ["all", ...new Set(logs.map(l => l.target_type).filter(Boolean))];

    const filtered = logs.filter(log => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q
            || log.admin_email.toLowerCase().includes(q)
            || log.action.toLowerCase().includes(q)
            || log.target_type.toLowerCase().includes(q)
            || log.target_id.toLowerCase().includes(q)
            || JSON.stringify(log.details).toLowerCase().includes(q);
        const matchesAction = actionFilter === "all" || log.action === actionFilter;
        const matchesTarget = targetFilter === "all" || log.target_type === targetFilter;
        return matchesSearch && matchesAction && matchesTarget;
    });

    if (!logs || logs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">監査ログがありません</p>
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
                        placeholder="管理者・アクション・対象・詳細で検索"
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
                <select
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value)}
                    className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white w-auto"
                >
                    {actions.map(a => <option key={a} value={a}>{a === "all" ? "すべてのアクション" : ACTION_LABELS[a] || a}</option>)}
                </select>
                <select
                    value={targetFilter}
                    onChange={e => setTargetFilter(e.target.value)}
                    className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white w-auto"
                >
                    {targets.map(t => <option key={t} value={t}>{t === "all" ? "すべての対象" : t}</option>)}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">
                        {searchQuery ? `"${searchQuery}" に一致するログはありません` : "該当するログはありません"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 font-medium">
                        {filtered.length} 件表示
                        {logs.length > filtered.length && <span className="ml-1">（全 {logs.length} 件中）</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">日時</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">管理者</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">アクション</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">対象</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">詳細</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(log.created_at).toLocaleString('ja-JP', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                {log.admin_email}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {ACTION_ICONS[log.action] || <Shield className="w-3.5 h-3.5 text-slate-500" />}
                                                {ACTION_LABELS[log.action] || log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {TARGET_ICONS[log.target_type] || <Database className="w-3.5 h-3.5 text-slate-500" />}
                                                {log.target_type}
                                            </span>
                                            <span className="text-xs text-slate-500 ml-1 font-mono">#{log.target_id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <details className="group">
                                                <summary className="text-xs text-slate-500 hover:text-blue-600 cursor-pointer flex items-center gap-1">
                                                    詳細を表示
                                                    <ExternalLink className="w-3 h-3" />
                                                </summary>
                                                <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
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