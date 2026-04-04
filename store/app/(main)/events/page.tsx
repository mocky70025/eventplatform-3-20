import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    area?: string;
    category?: string;
    period?: string;
    fee?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 12;

// Gradient placeholders for cards without images
const gradients = [
  "linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #059669 100%)",
  "linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)",
  "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #6d28d9 100%)",
  "linear-gradient(135deg, #67e8f9 0%, #0ea5e9 50%, #0369a1 100%)",
  "linear-gradient(135deg, #fda4af 0%, #ec4899 50%, #be185d 100%)",
  "linear-gradient(135deg, #a5f3fc 0%, #2dd4bf 50%, #0d9488 100%)",
];

// Category tag color mapping
function getCategoryColor(genre: string | null | undefined): { bg: string; text: string } {
  switch (genre) {
    case "音楽フェス":
      return { bg: "bg-purple-100", text: "text-purple-700" };
    case "ライブ":
      return { bg: "bg-violet-100", text: "text-violet-700" };
    case "マルシェ":
      return { bg: "bg-pink-100", text: "text-pink-700" };
    case "フリーマーケット":
      return { bg: "bg-rose-100", text: "text-rose-700" };
    case "地域おこし":
      return { bg: "bg-amber-100", text: "text-amber-700" };
    case "祭り":
      return { bg: "bg-red-100", text: "text-red-700" };
    case "食フェス":
      return { bg: "bg-orange-100", text: "text-orange-700" };
    case "グルメイベント":
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case "スポーツ":
      return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case "アウトドア":
      return { bg: "bg-teal-100", text: "text-teal-700" };
    case "企業":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "展示会":
      return { bg: "bg-indigo-100", text: "text-indigo-700" };
    default:
      return { bg: "bg-sky-100", text: "text-sky-700" };
  }
}

function getRemainingDays(dateStr: string | null | undefined): { days: number; label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const now = new Date();
  const deadline = new Date(dateStr);
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  return {
    days: diff,
    label: `残り${diff}日`,
    urgent: diff <= 7,
  };
}

export default async function EventSearchPage({ searchParams }: PageProps) {
  const { q, area, category, period, fee, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("events")
    .select("*, organizers(company_name)", { count: "exact" })
    .eq("status", "published")
    .or("visibility.eq.public,visibility.is.null")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("event_name", `%${q}%`);
  }

  if (area && area !== "全国") {
    query = query.ilike("address", `%${area}%`);
  }

  if (category && category !== "すべて") {
    query = query.eq("genre", category);
  }

  if (period && period !== "すべて") {
    const now = new Date();
    let endDate: Date | null = null;
    if (period === "今月") {
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === "来月") {
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    } else if (period === "3ヶ月以内") {
      endDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    }
    if (endDate) {
      query = query.gte("event_start_date", now.toISOString().split("T")[0]);
      query = query.lte("event_start_date", endDate.toISOString().split("T")[0]);
    }
  }

  // Pagination
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // If fee filter is active, we need to fetch all and filter post-query
  // because fee is stored as text (e.g. "10,000円", "無料")
  const hasFeeFilter = fee && fee !== "すべて";
  if (!hasFeeFilter) {
    query = query.range(from, to);
  }

  const { data: rawEvents, count: rawCount, error } = await query;

  // Post-query fee filter
  function parseFeeAmount(feeStr: string | null | undefined): number {
    if (!feeStr || feeStr === "無料" || feeStr === "0") return 0;
    const num = parseInt(feeStr.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? -1 : num;
  }

  let events = rawEvents;
  let count = rawCount;

  if (hasFeeFilter && rawEvents) {
    const filtered = rawEvents.filter((e) => {
      const amount = parseFeeAmount(e.fee);
      if (fee === "無料") return amount === 0;
      if (fee === "~10,000円") return amount > 0 && amount <= 10000;
      if (fee === "~30,000円") return amount > 0 && amount <= 30000;
      if (fee === "30,000円~") return amount > 30000;
      return true;
    });
    count = filtered.length;
    events = filtered.slice(from, to + 1);
  }

  if (error) {
    // ignore
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Build search params string for pagination links
  function buildSearchParams(pageNum: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (area) params.set("area", area);
    if (category) params.set("category", category);
    if (period) params.set("period", period);
    if (fee) params.set("fee", fee);
    params.set("page", String(pageNum));
    return `?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-2">
          <Link href="/" className="text-store-600 hover:underline">
            ホーム
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">イベント検索</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-6">イベント検索</h1>

        {/* Search / Filter Bar */}
        <form action="/events" method="GET" className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          {/* Search Input */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="イベント名、キーワードで検索..."
              className="w-full rounded-xl py-2.5 px-4 pl-12 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 placeholder:text-slate-400"
            />
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Area */}
            <select
              name="area"
              defaultValue={area || "全国"}
              className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-store-500 bg-white"
            >
              <option>全国</option>
              <optgroup label="北海道・東北">
                <option>北海道</option>
                <option>青森県</option>
                <option>岩手県</option>
                <option>宮城県</option>
                <option>秋田県</option>
                <option>山形県</option>
                <option>福島県</option>
              </optgroup>
              <optgroup label="関東">
                <option>茨城県</option>
                <option>栃木県</option>
                <option>群馬県</option>
                <option>埼玉県</option>
                <option>千葉県</option>
                <option>東京都</option>
                <option>神奈川県</option>
              </optgroup>
              <optgroup label="中部">
                <option>新潟県</option>
                <option>富山県</option>
                <option>石川県</option>
                <option>福井県</option>
                <option>山梨県</option>
                <option>長野県</option>
                <option>岐阜県</option>
                <option>静岡県</option>
                <option>愛知県</option>
              </optgroup>
              <optgroup label="近畿">
                <option>三重県</option>
                <option>滋賀県</option>
                <option>京都府</option>
                <option>大阪府</option>
                <option>兵庫県</option>
                <option>奈良県</option>
                <option>和歌山県</option>
              </optgroup>
              <optgroup label="中国">
                <option>鳥取県</option>
                <option>島根県</option>
                <option>岡山県</option>
                <option>広島県</option>
                <option>山口県</option>
              </optgroup>
              <optgroup label="四国">
                <option>徳島県</option>
                <option>香川県</option>
                <option>愛媛県</option>
                <option>高知県</option>
              </optgroup>
              <optgroup label="九州・沖縄">
                <option>福岡県</option>
                <option>佐賀県</option>
                <option>長崎県</option>
                <option>熊本県</option>
                <option>大分県</option>
                <option>宮崎県</option>
                <option>鹿児島県</option>
                <option>沖縄県</option>
              </optgroup>
            </select>

            {/* Category */}
            <select
              name="category"
              defaultValue={category || "すべて"}
              className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-store-500 bg-white"
            >
              <option>すべて</option>
              <option>音楽フェス</option>
              <option>ライブ</option>
              <option>マルシェ</option>
              <option>フリーマーケット</option>
              <option>地域おこし</option>
              <option>祭り</option>
              <option>食フェス</option>
              <option>グルメイベント</option>
              <option>スポーツ</option>
              <option>アウトドア</option>
              <option>企業</option>
              <option>展示会</option>
              <option>その他</option>
            </select>

            {/* Period */}
            <select
              name="period"
              defaultValue={period || "すべて"}
              className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-store-500 bg-white"
            >
              <option>すべて</option>
              <option>今月</option>
              <option>来月</option>
              <option>3ヶ月以内</option>
            </select>

            {/* Fee */}
            <select
              name="fee"
              defaultValue={fee || "すべて"}
              className="rounded-xl py-2.5 px-4 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-store-500 bg-white"
            >
              <option>すべて</option>
              <option>無料</option>
              <option>~10,000円</option>
              <option>~30,000円</option>
              <option>30,000円~</option>
            </select>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-store-500 hover:bg-store-600 text-white text-sm font-semibold rounded-xl py-2.5 px-6 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              検索する
            </button>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Results Count */}
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{totalCount}件</span>
              のイベントが見つかりました
            </span>
          </div>
        </form>

        {/* Event Cards Grid */}
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {events.map((event, index) => {
              const categoryColor = getCategoryColor(event.genre);
              const remaining = getRemainingDays(event.application_period_end);
              const isUrgent = remaining?.urgent ?? false;
              const gradient = gradients[index % gradients.length];

              return (
                <Link
                  href={`/events/${event.id}`}
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-200 card-hover overflow-hidden block"
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
                    {/* Category Tags */}
                    <div className="flex items-center gap-2 mb-2">
                      {event.genre && (
                        <span
                          className={`text-[11px] font-semibold px-2 rounded-full ${categoryColor.bg} ${categoryColor.text} inline-flex items-center justify-center h-5`}
                          style={{ lineHeight: 1 }}
                        >
                          {event.genre}
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
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
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
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
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
                        <span className="text-slate-400">出店料</span>
                        <span className="ml-1.5 font-bold text-slate-900">
                          {event.fee || "未定"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">募集枠</span>
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
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 mb-10">
            <svg
              className="w-10 h-10 text-slate-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-slate-500 font-medium mb-2">
              該当するイベントが見つかりませんでした。
            </p>
            <Link
              href="/events"
              className="text-store-600 hover:underline text-sm font-medium"
            >
              すべてのイベントを表示
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            {/* Previous */}
            {currentPage > 1 ? (
              <Link
                href={`/events${buildSearchParams(currentPage - 1)}`}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                前へ
              </Link>
            ) : (
              <span className="px-3 py-2 text-sm text-slate-300 flex items-center gap-1">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                前へ
              </span>
            )}

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                if (i > 0) {
                  const prev = arr[i - 1];
                  if (p - prev > 1) acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="w-9 h-9 flex items-center justify-center text-sm text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={`/events${buildSearchParams(item)}`}
                    className={`w-9 h-9 text-sm font-semibold rounded-lg inline-flex items-center justify-center leading-none ${
                      item === currentPage
                        ? "text-white bg-store-500"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {item}
                  </Link>
                )
              )}

            {/* Next */}
            {currentPage < totalPages ? (
              <Link
                href={`/events${buildSearchParams(currentPage + 1)}`}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1"
              >
                次へ
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="px-3 py-2 text-sm text-slate-300 flex items-center gap-1">
                次へ
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
