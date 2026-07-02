"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReviewFormProps {
    eventId: string;
    organizerUserId: string;
    existingReview: { rating: number; comment: string | null } | null;
}

export function ReviewForm({ eventId, organizerUserId, existingReview }: ReviewFormProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(existingReview?.comment || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const isReviewed = existingReview || submitted;

    const handleSubmit = async () => {
        if (!rating) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: eventId,
                    reviewee_id: organizerUserId,
                    rating,
                    comment,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "送信に失敗しました");
            }
            setSubmitted(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isReviewed) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">主催者へのレビュー</h3>
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>レビュー送信済みです</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-5 h-5 ${
                                star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                            }`}
                        />
                    ))}
                </div>
                {comment && (
                    <p className="text-sm text-slate-600 leading-relaxed">{comment}</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-store-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">主催者へのレビュー</h3>
            <p className="text-xs text-slate-500 mb-4">イベントはいかがでしたか？主催者への評価を送りましょう。</p>

            <div className="space-y-4">
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
                        placeholder="主催者へのフィードバックを入力してください..."
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-store-400 resize-none"
                    />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <Button
                    onClick={handleSubmit}
                    disabled={!rating || isLoading}
                    className="w-full h-10 rounded-xl text-sm disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        "レビューを送信"
                    )}
                </Button>
            </div>
        </div>
    );
}
