import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: organizerCount },
    { count: exhibitorCount },
    { count: publishedEventCount },
    { count: monthlyAppCount },
    { count: pendingOrgCount },
    { count: pendingEventCount },
  ] = await Promise.all([
    supabase.from("organizers").select("*", { count: "exact", head: true }),
    supabase.from("exhibitors").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("event_applications").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("organizers").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "主催者", value: organizerCount || 0 },
    { label: "出店者", value: exhibitorCount || 0 },
    { label: "公開イベント", value: publishedEventCount || 0 },
    { label: "今月の応募", value: monthlyAppCount || 0 },
  ];

  const todos = [
    { label: "新規主催者の承認", count: pendingOrgCount || 0, route: "/organizers" },
    { label: "イベント公開申請", count: pendingEventCount || 0, route: "/events?filter=pending" },
  ].filter((t) => t.count > 0);

  return (
    <div className="min-h-screen bg-[#eff4fb]">
      <main className="max-w-6xl mx-auto py-8 px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">ダッシュボード</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 要対応 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">要対応</h2>
          {todos.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {todos.map((t) => (
                <div key={t.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-slate-900">{t.label}</span>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {t.count}件
                    </span>
                  </div>
                  <Link
                    href={t.route}
                    className="inline-flex items-center justify-center text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    確認
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-3">対応が必要な項目はありません。</p>
          )}
        </div>
      </main>
    </div>
  );
}
