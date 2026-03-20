import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Check, Building2, User, FileText, Calendar, Clock, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  // Fetch Stats
  const { count: organizerCount } = await supabase.from("organizers").select("*", { count: "exact", head: true });
  const { count: exhibitorCount } = await supabase.from("exhibitors").select("*", { count: "exact", head: true });
  const { count: eventCount } = await supabase.from("events").select("*", { count: "exact", head: true });
  const { count: pendingOrgCount } = await supabase.from("organizers").select("*", { count: "exact", head: true }).eq("is_approved", false);

  // Fetch Pending Organizers
  const { data: pendingOrganizers } = await supabase
    .from("organizers")
    .select("id, company_name, name, created_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch Draft/Recent Events
  const { data: recentEvents } = await supabase
    .from("events")
    .select(`
      id, event_name, status, created_at,
      organizer:organizers(company_name, name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            管理者ダッシュボード
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            システム正常稼働中
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Link href="/organizers" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">主催者数</p>
            <p className="text-3xl font-bold text-slate-900">{organizerCount || 0}</p>
          </Link>

          <Link href="/organizers" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              {(pendingOrgCount || 0) > 0 && (
                <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 rounded-full inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>要対応</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">承認待ち主催者</p>
            <p className="text-3xl font-bold text-slate-900">{pendingOrgCount || 0}</p>
          </Link>

          <Link href="/exhibitors" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">出店者数</p>
            <p className="text-3xl font-bold text-slate-900">{exhibitorCount || 0}</p>
          </Link>

          <Link href="/events" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">イベント数</p>
            <p className="text-3xl font-bold text-slate-900">{eventCount || 0}</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Organizer Approvals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400" />
                承認待ちの主催者
                {pendingOrganizers && pendingOrganizers.length > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {pendingOrganizers.length}
                  </span>
                )}
              </h2>
              <Link href="/organizers" className="text-xs font-medium text-blue-600 hover:underline">
                すべて見る
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {pendingOrganizers?.map((org) => (
                <div key={org.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{org.company_name || org.name}</h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <User className="h-3 w-3" /> {org.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                        {new Date(org.created_at).toLocaleDateString('ja-JP')} に登録
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/organizers#org-${org.id}`} className="w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs py-1 h-8 rounded-lg">
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {(!pendingOrganizers || pendingOrganizers.length === 0) && (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">承認待ちの主催者はいません</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                最近のイベント
              </h2>
              <Link href="/events" className="text-xs font-medium text-blue-600 hover:underline">
                すべて見る
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {recentEvents?.map((event) => (
                <div key={event.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{event.event_name}</h3>
                      <div className="text-xs text-slate-500 mt-1">
                        主催: {(event.organizer as any)?.company_name || (event.organizer as any)?.name}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${event.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {event.status === 'published' ? '公開中' : '下書き'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/events#event-${event.id}`} className="w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs py-1 h-8 rounded-lg">
                        イベント管理へ
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {(!recentEvents || recentEvents.length === 0) && (
                <div className="p-12 text-center text-slate-400 text-sm">
                  イベントがまだありません
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
