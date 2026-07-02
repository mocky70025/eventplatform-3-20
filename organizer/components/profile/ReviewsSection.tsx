"use client";

import { Star } from "lucide-react";

interface Review {
    id: string;
    event_name: string;
    reviewer_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

interface ReviewsSectionProps {
    reviews: Review[];
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${
                        star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-200"
                    }`}
                />
            ))}
        </div>
    );
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-2">直近の評価</h3>
                <p className="text-sm text-slate-500 mb-6">イベント終了後に出店者から届いた評価です（直近3件）</p>
                <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">まだ評価がありません</p>
                    <p className="text-xs text-slate-500 mt-1">イベント終了後に出店者から評価が届きます</p>
                </div>
            </div>
        );
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Header with title + average rating */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900">直近の評価</h3>
                <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-lg font-bold text-slate-900">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-slate-500">({reviews.length}件)</span>
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-6">イベント終了後に出店者から届いた評価です（直近3件）</p>

            {/* Review cards */}
            <div className="divide-y divide-slate-100">
                {reviews.map((review) => (
                    <div key={review.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-700">
                                    {review.reviewer_name.substring(0, 1)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{review.reviewer_name}</p>
                                    <p className="text-xs text-slate-500">{review.event_name}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <StarRating rating={review.rating} />
                                <p className="text-xs text-slate-500">
                                    {new Date(review.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "/")}
                                </p>
                            </div>
                        </div>
                        {review.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed ml-[52px]">{review.comment}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
