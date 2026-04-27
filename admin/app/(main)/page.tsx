import { Check, Building2, User, FileText, Calendar, Clock, Store, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "承認待ち",
  published: "公開中",
  rejected: "却下",
  draft: "非公開",
  closed: "募集終了",
  ended: "終了",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  draft: "bg-slate-100 text-slate-500",
  closed: "bg-slate-100 text-slate-500",
  ended: "bg-slate-100 text-slate-500",
};

export default async function Home() {
  const supabase = await createClient();

  const [
    { count: organizerCount },
    { count: exhibitorCount },
    { count: eventCount },
    { count: pendingOrgCount },
    { count: pendingEventCount },
    { data: pendingOrganizers },
    { data: pendingEvents },
  ] = await Promise.all([
    supabase.from("organizers").select("*", { count: "exact", head: true }),
    supabase.from("exhibitors").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("organizers").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("organizers")
      .select("id, company_name, name, created_at")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, event_name, status, created_at, organizer:organizers(company_name, name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const hasPendingAction = (pendingOrgCount || 0) > 0 || (pendingEventCount || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">管理者ダッシュボード</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            システム正常稼働中
          </div>
        </div>

        {/* 要対応バナー */}
        {hasPendingAction && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              対応が必要な項目があります：
              {(pendingOrgCount || 0) > 0 && <span className="ml-2">主催者承認待ち {pendingOrgCount} 件</span>}
              {(pendingEventCount || 0) > 0 && <span className="ml-2">イベント承認待ち {pendingEventCount} 件</span>}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <Link href="/organizers" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">主催者数</p>
            <p className="text-3xl font-bold text-slate-900">{organizerCount || 0}</p>
          </Link>

          <Link href="/organizers" className={`rounded-2xl border p-5 hover:border-slate-300 transition-colors block ${(pendingOrgCount || 0) > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(pendingOrgCount || 0) > 0 ? 'bg-yellow-100' : 'bg-yellow-50'}`}>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              {(pendingOrgCount || 0) > 0 && (
                <span className="text-xs text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded-full">要対応</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">承認待ち主催者</p>
            <p className="text-3xl font-bold text-slate-900">{pendingOrgCount || 0}</p>
          </Link>

          <Link href="/events?filter=pending" className={`rounded-2xl border p-5 hover:border-slate-300 transition-colors block ${(pendingEventCount || 0) > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(pendingEventCount || 0) > 0 ? 'bg-orange-100' : 'bg-orange-50'}`}>
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              {(pendingEventCount || 0) > 0 && (
                <span className="text-xs text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">要対応</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">承認待ちイベント</p>
            <p className="text-3xl font-bold text-slate-900">{pendingEventCount || 0}</p>
          </Link>

          <Link href="/exhibitors" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <Store className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">出店者数</p>
            <p className="text-3xl font-bold text-slate-900">{exhibitorCount || 0}</p>
          </Link>

          <Link href="/events" className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors block">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">イベント数</p>
            <p className="text-3xl font-bold text-slate-900">{eventCount || 0}</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 承認待ち主催者 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400" />
                承認待ちの主催者
                {(pendingOrganizers?.length || 0) > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {pendingOrganizers!.length}
                  </span>
                )}
              </h2>
              <Link href="/organizers" className="text-xs font-medium text-blue-600 hover:underline">すべて見る</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {pendingOrganizers && pendingOrganizers.length > 0 ? pendingOrganizers.map((org) => (
                <div key={org.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {(org.company_name || org.name || "?").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{org.company_name || org.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />{org.name} · {new Date(org.created_at).toLocaleDateString('ja-JP')}登録
                      </p>
                    </div>
                  </div>
                  <Link href={`/organizers#org-${org.id}`} className="shrink-0">
                    <span className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap">対応する</span>
                  </Link>
                </div>
              )) : (
                <div className="p-10 text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">承認待ちの主催者はいません</p>
                </div>
              )}
            </div>
          </div>

          {/* 承認待ちイベント */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                承認待ちのイベント
                {(pendingEvents?.length || 0) > 0 && (
                  <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {pendingEvents!.length}
                  </span>
                )}
              </h2>
              <Link href="/events" className="text-xs font-medium text-blue-600 hover:underline">すべて見る</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {pendingEvents && pendingEvents.length > 0 ? pendingEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{event.event_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        主催: {(event.organizer as any)?.company_name || (event.organizer as any)?.name} · {new Date(event.created_at).toLocaleDateString('ja-JP')}申請
                      </p>
                    </div>
                  </div>
                  <Link href={`/events#event-${event.id}`} className="shrink-0">
                    <span className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap">対応する</span>
                  </Link>
                </div>
              )) : (
                <div className="p-10 text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">承認待ちのイベントはありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
