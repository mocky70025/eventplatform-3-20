"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createEventDraft } from "./actions";

export function CreateEventDraftButton() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    const createDraft = async () => {
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
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={createDraft}
                disabled={isCreating}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                新規イベント作成
            </button>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}
        </div>
    );
}
