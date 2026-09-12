"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LegalModal } from "@/components/LegalModal";
import { createEventDraft } from "../actions";

export default function NewEventPage() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    const start = async () => {
        if (!agreed) return;
        setIsCreating(true);
        setError("");
        try {
            const id = await createEventDraft();
            router.push(`/events/${id}/edit`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "下書きの作成に失敗しました。");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fdf8f1]">
            <LegalModal type={showTerms ? "terms" : null} onClose={() => setShowTerms(false)} />
            <main className="mx-auto max-w-2xl px-6 py-16">
                <Link href="/events" className="text-sm font-medium text-slate-500 hover:text-slate-700">イベント一覧に戻る</Link>
                <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Plus className="h-6 w-6" /></div>
                    <h1 className="text-2xl font-bold text-slate-900">新しいイベントを作成</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500">まず空の下書きを作成します。内容は保存するまで公開・審査提出されず、必要な項目を後から入力できます。</p>
                    <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-500" />
                        <span>内容を確認し、<button type="button" onClick={(event) => { event.preventDefault(); setShowTerms(true); }} className="font-semibold text-orange-600 underline">利用規約</button>に同意して下書きを作成します</span>
                    </label>
                    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}
                    <button type="button" onClick={start} disabled={!agreed || isCreating} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        下書きを作成して入力を始める
                    </button>
                </section>
            </main>
        </div>
    );
}
