import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, FileText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch (error) {
    // Silently handle auth errors - user will be null
  }

  // Build events query
  let eventsQuery = supabase
    .from("events")
    .select("*, organizers(company_name)")
    .eq("status", "published")
    .or("visibility.eq.public,visibility.is.null")
    .order("created_at", { ascending: false });

  if (q) {
    eventsQuery = eventsQuery.ilike("event_name", `%${q}%`);
  }

  // Fetch user-specific data if logged in
  let exhibitor: { id: string; shop_name?: string } | null = null;
  let applications: Array<{
    id: string;
    status: string;
    created_at: string;
    event: {
      id: string;
      event_name: string;
      event_start_date: string;
      venue_name: string;
      main_image_url: string | null;
    };
  }> | null = null;
  let approvedCount = 0;
  let pendingCount = 0;
  let totalParticipations = 0;
  let events: any[] | null = null;

  // Run all queries in parallel
  if (user) {
    const [eventsResult, exhibitorResult] = await Promise.all([
      eventsQuery,
      supabase
        .from("exhibitors")
        .select("id, shop_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    events = eventsResult.data;
    exhibitor = exhibitorResult.data?.[0] || null;

    if (exhibitor) {
      const { data: appData } = await supabase
        .from("event_applications")
        .select(`
          id,
          status,
          created_at,
          event:events (
            id,
            event_name,
            event_start_date,
            venue_name,
            main_image_url
          )
        `)
        .eq("exhibitor_id", exhibitor.id)
        .order("created_at", { ascending: false });

      applications = appData as any;

      if (applications && Array.isArray(applications)) {
        approvedCount = applications.filter((a: any) => a.status === "approved").length;
        pendingCount = applications.filter((a: any) => a.status === "pending").length;
        totalParticipations = approvedCount;
      }
    }
  } else {
    events = (await eventsQuery).data;
  }

  // Helper: compute days remaining until application_period_end
  function getDaysRemaining(endDate: string | null): number | null {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  // Helper: status badge for application
  function getStatusInfo(status: string) {
    switch (status) {
      case "approved":
        return { label: "承認済み", bgClass: "bg-store-50", textClass: "text-store-700" };
      case "rejected":
        return { label: "不承認", bgClass: "bg-red-50", textClass: "text-red-600" };
      case "pending":
        return { label: "審査中", bgClass: "bg-amber-50", textClass: "text-amber-700" };
      default:
        return { label: "保留中", bgClass: "bg-slate-100", textClass: "text-slate-600" };
    }
  }

  // Gradient placeholders for cards without images
  const gradients = [
    "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
    "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)",
    "linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)",
  ];

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">

        {/* Hero Section */}
        {user && exhibitor ? (
          /* Logged-in Hero with greeting and stats */
          <section className="bg-gradient-to-r from-store-500 to-store-700 rounded-2xl p-6 sm:p-8 text-white mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2">
                  おかえりなさい、{exhibitor.shop_name || "ゲスト"}さん
                </h1>
                <p className="text-store-100 text-sm">今日も出店を盛り上げましょう</p>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded-xl px-4 py-2 self-start">
                <Calendar className="w-4 h-4 text-store-200" />
                <span className="text-sm text-store-100">{dateStr}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-store-200">参加予定イベント</p>
                    <p className="text-2xl font-bold">
                      {approvedCount}
                      <span className="text-sm font-normal ml-0.5">件</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-store-200">審査中の申込</p>
                    <p className="text-2xl font-bold">
                      {pendingCount}
                      <span className="text-sm font-normal ml-0.5">件</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-store-200">累計出店回数</p>
                    <p className="text-2xl font-bold">
                      {totalParticipations}
                      <span className="text-sm font-normal ml-0.5">回</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Non-logged-in Hero with CTA */
          <section className="bg-gradient-to-r from-store-500 to-store-700 rounded-2xl p-8 sm:p-12 text-white mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              あなたの出店を、もっと自由に、スマートに。
            </h1>
            <p className="text-store-100 text-base mb-8 max-w-lg mx-auto">
              場所探しから集客までを一つに。輝くイベントと、あなたの情熱を繋ぎます。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-store-700 hover:bg-store-50 font-bold rounded-xl px-8"
                >
                  今すぐ無料で始める
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white border border-white/30 hover:bg-white/10 font-bold rounded-xl px-8"
                >
                  ログイン
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* 直近のイベント */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {q ? `「${q}」の検索結果` : "直近のイベント"}
            </h2>
            <Link
              href="/events"
              className="text-sm text-store-600 hover:text-store-700 font-medium flex items-center gap-1"
            >
              すべて見る
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.slice(0, 6).map((event, index) => {
                const daysLeft = getDaysRemaining(event.application_period_end);
                const isClosingSoon = daysLeft !== null && daysLeft <= 5;

                return (
                  <Link
                    href={`/events/${event.id}`}
                    key={event.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover cursor-pointer"
                  >
                    {/* Card Image */}
                    <div className="h-44 relative">
                      {event.main_image_url ? (
                        <Image
                          src={event.main_image_url}
                          alt={event.event_name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: gradients[index % gradients.length] }}
                        />
                      )}
                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`${
                            isClosingSoon
                              ? "bg-amber-500"
                              : "bg-store-500"
                          } text-white text-xs font-semibold px-3 rounded-lg inline-flex items-center justify-center h-6`}
                          style={{ lineHeight: 1 }}
                        >
                          {isClosingSoon ? "締切間近" : "募集中"}
                        </span>
                      </div>
                      {/* Days remaining badge */}
                      {daysLeft !== null && (
                        <div className="absolute top-3 right-3">
                          <span
                            className="bg-white/90 text-slate-700 text-xs font-semibold px-3 rounded-lg inline-flex items-center justify-center h-6"
                            style={{ lineHeight: 1 }}
                          >
                            残り{daysLeft}日
                          </span>
                        </div>
                      )}
                      {/* Category tags */}
                      {event.genre && (
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          <span
                            className="bg-white/90 text-slate-600 text-[10px] font-medium px-2 rounded-md inline-flex items-center justify-center h-5"
                            style={{ lineHeight: 1 }}
                          >
                            {event.genre}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-2.5 line-clamp-1">
                        {event.event_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{event.event_start_date}{event.event_end_date && event.event_end_date !== event.event_start_date ? ` - ${event.event_end_date}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{event.venue_name || event.address || "未定"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400">出店料</span>
                          <p className="text-sm font-bold text-slate-900">
                            {event.fee || "要確認"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">募集枠</span>
                          <p className="text-sm font-semibold text-store-600">
                            {event.max_exhibitors
                              ? `${event.max_exhibitors}枠`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">該当するイベントが見つかりませんでした。</p>
              <Link href="/">
                <Button variant="ghost" className="text-store-600 mt-2">
                  すべてのイベントを表示
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* 申込状況 - Only for logged-in users with applications */}
        {user && applications && applications.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">申込状況</h2>
              <Link
                href="/applications"
                className="text-sm text-store-600 hover:text-store-700 font-medium flex items-center gap-1"
              >
                すべての申込を見る
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200">
              {/* Table Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 px-4 sm:px-6 py-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  イベント名
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
                  申込日
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  ステータス
                </span>
              </div>
              {/* Rows */}
              {applications.slice(0, 5).map((app, index) => {
                const statusInfo = getStatusInfo(app.status);
                const appDate = new Date(app.created_at);
                const appDateStr = `${appDate.getFullYear()}年${appDate.getMonth() + 1}月${appDate.getDate()}日`;
                const isLast = index === Math.min(applications!.length, 5) - 1;

                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className={`grid grid-cols-2 sm:grid-cols-3 items-center px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${
                      isLast ? "" : "border-b border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: gradients[index % gradients.length] }}
                      >
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {app.event?.event_name || "不明なイベント"}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500 hidden sm:block">{appDateStr}</span>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 ${statusInfo.bgClass} ${statusInfo.textClass} text-xs font-semibold h-7 px-3 rounded-full`}
                        style={{ lineHeight: 1 }}
                      >
                        {app.status === "approved" && (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        )}
                        {app.status === "pending" && (
                          <Clock className="w-3 h-3 shrink-0" />
                        )}
                        {app.status === "rejected" && (
                          <XCircle className="w-3 h-3 shrink-0" />
                        )}
                        {app.status !== "approved" &&
                          app.status !== "pending" &&
                          app.status !== "rejected" && (
                            <AlertCircle className="w-3 h-3 shrink-0" />
                          )}
                        {statusInfo.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Wacca - イベント出店プラットフォーム
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Copyright 2026 Wacca. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
