import { ArrowRight, Inbox, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getExhibitorTodos } from "@/lib/dashboard/todos";
import { EventCardGrid } from "./events/EventCardGrid";

const GRADIENTS = [
  "linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #059669 100%)",
  "linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)",
  "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #6d28d9 100%)",
  "linear-gradient(135deg, #67e8f9 0%, #0ea5e9 50%, #0369a1 100%)",
  "linear-gradient(135deg, #fda4af 0%, #ec4899 50%, #be185d 100%)",
  "linear-gradient(135deg, #a5f3fc 0%, #2dd4bf 50%, #0d9488 100%)",
];

export default async function Home() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // user stays null
  }

  let exhibitor: { id: string; shop_name?: string } | null = null;
  let applications: any[] = [];
  let todos: Awaited<ReturnType<typeof getExhibitorTodos>> = { todos: [], totalCount: 0, urgentCount: 0 };
  let openEventsCount = 0;

  if (user) {
    const { data: exData } = await supabase
      .from("exhibitors")
      .select("id, shop_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    exhibitor = exData?.[0] || null;

    if (exhibitor) {
      const [{ data: appData }, todoResult, openCountRes] = await Promise.all([
        supabase
          .from("event_applications")
          .select(`
            id, status, created_at,
            event:events ( id, event_name, event_start_date, venue_name, main_image_url )
          `)
          .eq("exhibitor_id", exhibitor.id)
          .order("created_at", { ascending: false })
          .limit(6),
        getExhibitorTodos(supabase, exhibitor.id, user.id),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
      ]);
      applications = (appData as any) || [];
      todos = todoResult;
      openEventsCount = openCountRes.count || 0;
    }
  }

  const pendingCount = applications.filter((a: any) => a.status === "pending").length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "採用", className: "bg-store-100 text-store-700" };
      case "rejected":
        return { label: "不採用", className: "bg-slate-100 text-slate-500" };
      default:
        return { label: "審査中", className: "bg-amber-100 text-amber-700" };
    }
  };

  const statusNote = (status: string) => {
    switch (status) {
      case "approved":
        return "出店確定";
      case "rejected":
        return "結果通知済み";
      default:
        return "審査中";
    }
  };

  // 未ログインは公開イベントの閲覧のみ（応募・TODOは非表示）
  if (!user) {
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, event_name, genre, event_start_date, event_end_date, application_period_end, venue_name, address, main_image_url, fee, recruit_count")
      .eq("status", "published")
      .or("visibility.eq.public,visibility.is.null")
      .order("created_at", { ascending: false })
      .limit(12);
    const events = (eventsData as any[]) || [];
    return (
      <div className="min-h-screen bg-[#f0fdf4]">
        <main className="max-w-6xl mx-auto py-8 px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">募集中のイベント</h1>
            <p className="text-sm text-slate-500 mt-1.5">気になるイベントを見つけたら、無料登録して応募できます。</p>
          </div>
          {events.length > 0 ? (
            <>
              <EventCardGrid events={events} gradients={GRADIENTS} />
              <div className="mt-8 text-center">
                <Link href="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-store-600 hover:text-store-700">
                  すべてのイベントを見る <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">現在募集中のイベントはありません。</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4]">
      <main className="max-w-6xl mx-auto py-8 px-6">

        {/* === 最近の応募状況 === */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">最近の応募状況</h2>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold bg-store-100 text-store-700 px-2.5 py-1 rounded-full">
                  {pendingCount}件
                </span>
              )}
            </div>
            <Link href="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-store-600 hover:text-store-700">
              すべて見る <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.slice(0, 3).map((app: any) => {
                const ev = app.event;
                const badge = statusBadge(app.status);
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {ev?.main_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.main_image_url} alt="" className="w-full aspect-video object-cover bg-slate-100" />
                    ) : (
                      <div className="w-full aspect-video bg-store-50" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                          {ev?.event_start_date ? new Date(ev.event_start_date).toLocaleDateString("ja-JP") : "日付未定"}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">{ev?.event_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {[ev?.venue_name, statusNote(app.status)].filter(Boolean).join("　・　")}
                      </p>
                      <Link
                        href={`/applications/${app.id}`}
                        className="mt-3 w-full inline-flex items-center justify-center bg-store-500 hover:bg-store-600 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : exhibitor && openEventsCount === 0 ? (
            // 募集ゼロ: ログイン中 ＆ 募集中のイベントが一つもない
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-store-50 flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-store-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">現在募集中のイベントがありません</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                新しいイベントが公開されると、ここに表示されます。<br />
                通知でもお知らせするので、プロフィールを整えてお待ちください。
              </p>
            </div>
          ) : (
            // 応募ゼロ: 募集中イベントはあるが、まだ応募していない
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-store-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-store-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">まだ応募がありません</h3>
              <p className="text-sm text-slate-500 max-w-sm">気になるイベントを探して、応募してみましょう。</p>
              <Link
                href="/events"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-store-500 hover:bg-store-600 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
              >
                イベントを探す
              </Link>
            </div>
          )}
        </section>

        {/* === 今日のTODO（ログイン中のみ） === */}
        {exhibitor && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">今日のTODO</h2>
              {todos.totalCount > 0 && (
                <span className="text-xs font-semibold bg-store-100 text-store-700 px-2.5 py-1 rounded-full">
                  {todos.totalCount}件{todos.urgentCount > 0 && `・うち${todos.urgentCount}件 急ぎ`}
                </span>
              )}
            </div>
          </div>

          {todos.todos.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-2">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {todos.todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{todo.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{todo.meta}</p>
                    </div>
                    {todo.urgent && (
                      <span className="shrink-0 text-[10px] font-semibold bg-store-100 text-store-700 px-2 py-0.5 rounded-full">
                        急ぎ
                      </span>
                    )}
                    <Link
                      href={todo.action.route}
                      className="shrink-0 inline-flex items-center justify-center text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:bg-slate-50 transition-colors"
                    >
                      {todo.action.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">対応が必要なタスクはありません。</p>
            </div>
          )}
        </section>
        )}

      </main>
    </div>
  );
}
