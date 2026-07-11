"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Check } from "lucide-react";

const DOC_LABELS = ["営業許可証", "食品衛生責任者証", "PL保険証書", "車検証", "火器類配置図", "その他"];

export default function RequestDocumentFix({
    exhibitorUserId,
    eventId,
    eventName,
    applicationId,
}: {
    exhibitorUserId: string;
    eventId: string;
    eventName: string;
    applicationId: string;
}) {
    const [open, setOpen] = useState(false);
    const [doc, setDoc] = useState(DOC_LABELS[0]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: exhibitorUserId,
                    user_type: "exhibitor",
                    type: "document_resubmit",
                    title: "提出書類の修正依頼",
                    message: `「${eventName}」の${doc}について修正のご依頼があります。${message ? `\n${message}` : ""}\nプロフィール＞書類 から更新してください。`,
                    related_event_id: eventId,
                    related_application_id: applicationId,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "送信に失敗しました");
            }
            setDone(true);
        } catch (e: any) {
            setError(e.message || "送信に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" /> 修正依頼を送信しました。出店者に通知されます。
            </div>
        );
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-xl px-4 py-2 transition-colors"
            >
                <AlertTriangle className="w-4 h-4" /> 書類の修正を依頼
            </button>
        );
    }

    return (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">対象の書類</label>
                <select
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    {DOC_LABELS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">修正内容・メッセージ（任意）</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="例：有効期限が切れているため、最新のものに更新してください。"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-4 py-2 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    修正依頼を送信
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2">
                    キャンセル
                </button>
            </div>
        </div>
    );
}
