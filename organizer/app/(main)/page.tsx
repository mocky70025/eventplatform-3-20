import { Plus, AlertCircle, ArrowRight, Star, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardTodos } from "@/lib/dashboard/todos";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("organizers")
    .select("id, company_name, is_approved")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  // Recent applications (newest first) for this organizer's events
  const { data: recentApps } = await supabase
    .from("event_applications")
    .select(`
      id, status, created_at,
      exhibitors(shop_name, genre, rating, gallery_images, cover_image, avatar_url),
      events!inner(id, event_name, organizer_id)
    `)
    .eq("events.organizer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const applications = recentApps || [];
  const { count: pendingCount } = await supabase
    .from("event_applications")
    .select("id, events!inner(organizer_id)", { count: "exact", head: true })
    .eq("events.organizer_id", profile.id)
    .eq("status", "pending");

  const newCount = pendingCount || 0;

  const { todos, totalCount, urgentCount } = await getDashboardTodos(supabase, profile.id);

  const cardImages = (ex: any): string[] => {
    const imgs: string[] = [];
    if (Array.isArray(ex?.gallery_images)) imgs.push(...ex.gallery_images.filter(Boolean));
    if (ex?.cover_image) imgs.push(ex.cover_image);
    if (ex?.avatar_url) imgs.push(ex.avatar_url);
    return imgs.slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-[#fdf8f1]">
      <main className="max-w-6xl mx-auto py-8 px-6">

        {/* Approval banner (only when not approved) */}
        {!profile.is_approved && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">承認待ち</h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  管理者による承認が完了するまで、イベントの作成はできません。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === 最近の応募 === */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">最近の応募</h2>
              {newCount > 0 && (
                <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                  新着 {newCount}件
                </span>
              )}
            </div>
            <Link href="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
              すべて見る <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((app: any) => {
                const ex = app.exhibitors;
                const imgs = cardImages(ex);
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                    {app.status === "pending" && (
                      <span className="inline-flex items-center text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mb-3">
                        新規申請
                      </span>
                    )}
                    {/* image strip */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[0, 1, 2].map((i) =>
                        imgs[i] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={imgs[i]} alt="" className="w-full h-20 object-cover rounded-lg bg-slate-100" />
                        ) : (
                          <div key={i} className="w-full h-20 rounded-lg bg-slate-100" />
                        )
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{ex?.shop_name || "出店者"}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      {ex?.genre && <span className="truncate">{ex.genre}</span>}
                      {ex?.rating && (
                        <span className="inline-flex items-center gap-0.5 text-slate-500">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {ex.rating}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/applications/${app.id}`}
                      className="mt-3 w-full inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                    >
                      詳細
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-orange-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">まだ応募が届いていません</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                イベントを公開すると、出店者から応募が届きます。<br />
                まずは新しくイベントを作ってみましょう。
              </p>
              {profile.is_approved && (
                <Link
                  href="/events/new"
                  className="mt-6 w-full max-w-md inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-3 transition-colors"
                >
                  <Plus className="w-4 h-4" /> 新しくイベントを作る
                </Link>
              )}
              <Link href="/events?status=draft" className="mt-3 text-sm text-slate-500 hover:text-slate-700">
                下書きのイベントを見る
              </Link>
            </div>
          )}
        </section>

        {/* === 今日のTODO === */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">今日のTODO</h2>
              {totalCount > 0 && (
                <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                  {totalCount}件{urgentCount > 0 && `・うち${urgentCount}件 急ぎ`}
                </span>
              )}
            </div>
            {totalCount > 0 && (
              <Link href="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
                全てを見る <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {todos.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-2">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-4">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{todo.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{todo.meta}</p>
                    </div>
                    {todo.urgent && (
                      <span className="shrink-0 text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
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

      </main>
    </div>
  );
}
