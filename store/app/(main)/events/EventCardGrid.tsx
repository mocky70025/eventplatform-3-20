"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";

interface EventData {
  id: string;
  event_name: string;
  genre: string | null;
  event_start_date: string;
  event_end_date: string | null;
  application_period_end: string | null;
  venue_name: string | null;
  address: string | null;
  main_image_url: string | null;
  fee: string | null;
  recruit_count: number | null;
}

interface EventCardGridProps {
  events: EventData[];
  gradients: string[];
}

function getCategoryColor(genre: string | null | undefined): { bg: string; text: string } {
  switch (genre) {
    case "音楽フェス": return { bg: "bg-purple-100", text: "text-purple-700" };
    case "ライブ": return { bg: "bg-violet-100", text: "text-violet-700" };
    case "マルシェ": return { bg: "bg-pink-100", text: "text-pink-700" };
    case "フリーマーケット": return { bg: "bg-rose-100", text: "text-rose-700" };
    case "地域おこし": return { bg: "bg-amber-100", text: "text-amber-700" };
    case "祭り": return { bg: "bg-red-100", text: "text-red-700" };
    case "食フェス": return { bg: "bg-orange-100", text: "text-orange-700" };
    case "グルメイベント": return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case "スポーツ": return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case "アウトドア": return { bg: "bg-teal-100", text: "text-teal-700" };
    case "企業": return { bg: "bg-blue-100", text: "text-blue-700" };
    case "展示会": return { bg: "bg-indigo-100", text: "text-indigo-700" };
    default: return { bg: "bg-sky-100", text: "text-sky-700" };
  }
}

function getRemainingDays(dateStr: string | null | undefined): { label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const now = new Date();
  const deadline = new Date(dateStr);
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  return { label: `残り${diff}日`, urgent: diff <= 7 };
}

export function EventCardGrid({ events, gradients }: EventCardGridProps) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wacca_bookmarks");
      if (stored) setBookmarks(JSON.parse(stored));
    } catch {}
  }, []);

  // Sort: bookmarked events first, then original order
  const sorted = [...events].sort((a, b) => {
    const aBookmarked = bookmarks.includes(a.id) ? 0 : 1;
    const bBookmarked = bookmarks.includes(b.id) ? 0 : 1;
    return aBookmarked - bBookmarked;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      {sorted.map((event, index) => {
        const categoryColor = getCategoryColor(event.genre);
        const remaining = getRemainingDays(event.application_period_end);
        const isUrgent = remaining?.urgent ?? false;
        const gradient = gradients[index % gradients.length];
        const isBookmarked = bookmarks.includes(event.id);

        return (
          <Link
            href={`/events/${event.id}`}
            key={event.id}
            className="bg-white rounded-2xl border border-slate-200 card-hover overflow-hidden block relative"
          >
            {/* Image Area */}
            <div className="relative h-44">
              {event.main_image_url ? (
                <Image
                  src={event.main_image_url}
                  alt={event.event_name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: gradient }}
                />
              )}

              {/* Status Badge - top left */}
              {isUrgent ? (
                <span
                  className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-3 rounded-full inline-flex items-center justify-center h-6"
                  style={{ lineHeight: 1 }}
                >
                  締切間近
                </span>
              ) : (
                <span
                  className="absolute top-3 left-3 bg-store-500 text-white text-xs font-semibold px-3 rounded-full inline-flex items-center justify-center h-6"
                  style={{ lineHeight: 1 }}
                >
                  募集中
                </span>
              )}

              {/* Remaining Days - top right */}
              {remaining && (
                <span
                  className={`absolute top-3 right-3 bg-white/90 text-xs font-semibold px-3 rounded-full inline-flex items-center justify-center h-6 ${
                    isUrgent ? "text-red-600" : "text-slate-700"
                  }`}
                  style={{ lineHeight: 1 }}
                >
                  {remaining.label}
                </span>
              )}
            </div>

            {/* Card Body */}
            <div className="p-5">
              {/* Category Tags + Bookmark Badge */}
              <div className="flex items-center gap-2 mb-2">
                {event.genre && (
                  <span
                    className={`text-xs font-semibold px-2 rounded-full ${categoryColor.bg} ${categoryColor.text} inline-flex items-center justify-center h-5`}
                    style={{ lineHeight: 1 }}
                  >
                    {event.genre}
                  </span>
                )}
                {isBookmarked && (
                  <span
                    className="text-xs font-semibold px-2 rounded-full bg-store-50 text-store-600 inline-flex items-center justify-center h-5 gap-0.5"
                    style={{ lineHeight: 1 }}
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                    保存済み
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 mb-3 leading-snug line-clamp-2">
                {event.event_name}
              </h3>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1.5">
                <svg
                  className="w-4 h-4 text-slate-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>
                  {event.event_start_date}
                  {event.event_end_date && event.event_end_date !== event.event_start_date
                    ? ` - ${event.event_end_date}`
                    : ""}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <svg
                  className="w-4 h-4 text-slate-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="truncate">
                  {event.venue_name || event.address || "会場未定"}
                </span>
              </div>

              {/* Fee and Remaining Slots */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-sm">
                  <span className="text-slate-500">出店料</span>
                  <span className="ml-1.5 font-bold text-slate-900">
                    {event.fee || "未定"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">募集枠</span>
                  <span
                    className={`ml-1.5 font-bold ${
                      event.recruit_count && event.recruit_count <= 3
                        ? "text-red-500"
                        : "text-store-600"
                    }`}
                  >
                    {event.recruit_count
                      ? `残り${event.recruit_count}枠`
                      : "未定"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
