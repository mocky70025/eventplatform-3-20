import { cn } from "@/lib/utils";
import { Plus, Calendar, MapPin, Users, ChevronRight, AlertCircle, CheckCircle2, FileText, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  // Get user - redirect to login if not authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get organizer profile
  const { data: profile, error: profileError } = await supabase
    .from("organizers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // profileError is handled by the !profile redirect below

  // If no profile, redirect to onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  // Fetch events + application counts in parallel
  const [eventsResult, pendingResult, totalResult, approvedResult] = await Promise.all([
    supabase
      .from("events")
      .select("*, event_applications(count)")
      .eq("organizer_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_applications")
      .select("id, events!inner(id, organizer_id)", { count: "exact", head: true })
      .eq("events.organizer_id", profile.id)
      .eq("status", "pending"),
    supabase
      .from("event_applications")
      .select("id, events!inner(id, organizer_id)", { count: "exact", head: true })
      .eq("events.organizer_id", profile.id),
    supabase
      .from("event_applications")
      .select("id, events!inner(id, organizer_id)", { count: "exact", head: true })
      .eq("events.organizer_id", profile.id)
      .eq("status", "approved"),
  ]);

  const safeEvents = eventsResult.data || [];
  const pendingApplications = pendingResult.count ?? 0;
  const totalApplications = totalResult.count ?? 0;
  const approvedApplications = approvedResult.count ?? 0;

  // Derive stats
  const publishedEventsCount = safeEvents.filter(e => e.status === 'published').length;

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-6xl mx-auto py-8 px-6">

            {/* Approval Status Banner */}
            {profile && !profile.is_approved && (
              <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-1">承認待ち</h3>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      現在、管理者による承認を待っています。承認が完了するまで、イベントの作成はできません。承認が完了次第、お知らせいたします。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-8 text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
              <div className="absolute bottom-0 right-32 w-40 h-40 bg-white/5 rounded-full translate-y-1/3"></div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-orange-100 mb-1">Welcome back</p>
                <h1 className="text-2xl font-bold mb-2">
                  おかえりなさい、{profile?.company_name || 'プロフィール未設定'}さん
                </h1>
                <p className="text-orange-100 mb-6">
                  {profile?.is_approved ? 'イベントの作成が可能です' : '管理者による承認を待っています'}
                </p>
                {profile?.is_approved ? (
                  <Link href="/events/new">
                    <button className="bg-white text-orange-700 font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-orange-50 transition-colors shadow-lg shadow-orange-900/20">
                      新しいイベントを作成
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="bg-white/50 text-orange-700/50 font-semibold rounded-xl px-6 py-2.5 text-sm cursor-not-allowed"
                  >
                    新しいイベントを作成
                  </button>
                )}
              </div>
            </div>

            {/* Stats Row - 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {/* Published events */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-1">開催予定イベント</p>
                <p className="text-3xl font-bold text-slate-900">{publishedEventsCount}</p>
              </div>

              {/* Pending applications */}
              <Link href="/applications" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-orange-200 transition-colors block">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  {pendingApplications > 0 && (
                    <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 rounded-full inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>要対応</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-1">承認待ち申込</p>
                <p className="text-3xl font-bold text-slate-900">{pendingApplications}</p>
              </Link>

              {/* Total applications */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-1">総応募数</p>
                <p className="text-3xl font-bold text-slate-900">{totalApplications}</p>
              </div>

              {/* Approved applications */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-1">承認済み出店者</p>
                <p className="text-3xl font-bold text-slate-900">{approvedApplications}</p>
              </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                あなたのイベント
              </h2>
              <Link href="/events" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                すべて見る
              </Link>
            </div>

            {/* Event List */}
            <div className="space-y-4">
              {safeEvents && safeEvents.length > 0 ? (
                safeEvents.map((event) => {
                  const appCount = event.event_applications?.[0]?.count || 0;
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="bg-white rounded-2xl border border-slate-200 p-5 block hover:border-orange-200 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {event.event_name}
                            </h3>
                            <span className={cn(
                              "h-5 inline-flex items-center justify-center text-xs font-semibold px-2.5 rounded-full",
                              event?.status === 'published' ? "bg-orange-100 text-orange-700"
                                : event?.status === 'pending' ? "bg-amber-100 text-amber-700"
                                : event?.status === 'rejected' ? "bg-red-100 text-red-700"
                                : event?.status === 'draft' ? "bg-slate-100 text-slate-600"
                                : "bg-slate-100 text-slate-600"
                            )} style={{ lineHeight: 1 }}>
                              {event?.status === 'published' ? '募集中' : event?.status === 'pending' ? '審査中' : event?.status === 'rejected' ? '却下' : event?.status === 'draft' ? '下書き' : '募集終了'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {event.event_start_date}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              {event.venue_name || event.address || "場所未定"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            申込: {appCount}件
                          </span>
                        </div>
                        <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700 flex items-center gap-1">
                          詳細を見る
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                profile?.is_approved ? (
                  <Link href="/events/new">
                    <div className="border-2 border-dashed border-orange-200/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-orange-400/50 hover:bg-orange-50/50 transition-colors cursor-pointer group">
                      <div className="p-4 bg-orange-50 rounded-full group-hover:bg-white transition-colors mb-4">
                        <Plus className="h-8 w-8 text-orange-400 group-hover:text-orange-600 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">最初のイベントを作成しましょう</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        イベントを作成して出店者の募集を開始しましょう。
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="border-2 border-dashed border-amber-200/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-amber-50/30">
                    <div className="p-4 bg-amber-100 rounded-full mb-4">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">承認待ちです</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      管理者による承認が完了するまで、イベントの作成はできません。
                    </p>
                  </div>
                )
              )}
            </div>

      </main>
    </div>
  );
}
