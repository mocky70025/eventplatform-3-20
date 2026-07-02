"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReviewEvent {
    id: string;
    event_name: string;
    existingReview: { rating: number; comment: string | null } | null;
}

interface ReviewFormProps {
    exhibitorUserId: string;
    events: ReviewEvent[];
}

export default function ReviewForm({ exhibitorUserId, events }: ReviewFormProps) {
    const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || "");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    const alreadyReviewed = selectedEvent?.existingReview || submitted[selectedEventId];

    const handleEventChange = (eventId: string) => {
        setSelectedEventId(eventId);
        setRating(0);
        setComment("");
        setError("");
    };

    const handleSubmit = async () => {
        if (!rating || !selectedEventId) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: selectedEventId,
                    reviewee_id: exhibitorUserId,
                    rating,
                    comment,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "送信に失敗しました");
            }
            setSubmitted((prev) => ({ ...prev, [selectedEventId]: true }));
            setRating(0);
            setComment("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (events.length === 0) {
        return (
            <p className="text-sm text-slate-500 text-center py-4">
                終了したイベントがないため、まだレビューできません
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {events.length > 1 && (
                <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">対象イベント</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => handleEventChange(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    >
                        {events.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.event_name}
                                {e.existingReview ? " ✓" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {alreadyReviewed ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>レビュー送信済みです</span>
                </div>
            ) : (
                <>
                    <div>
                        <label className="text-xs font-medium text-slate-500 block mb-2">評価</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-0.5"
                                >
                                    <Star
                                        className={`w-7 h-7 transition-colors ${
                                            star <= (hoverRating || rating)
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-slate-200 text-slate-200"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">コメント（任意）</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="出店者へのフィードバックを入力してください..."
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <Button
                        onClick={handleSubmit}
                        disabled={!rating || isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 h-10 rounded-xl text-sm disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "レビューを送信"
                        )}
                    </Button>
                </>
            )}
        </div>
    );
}
