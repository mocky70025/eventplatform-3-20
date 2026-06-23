import type { SupabaseClient } from "@supabase/supabase-js";

// Exhibitor dashboard TODO list. Derived from real signals:
// document expiries, upcoming approved events, unread notifications.
// Sort: urgent first, then time-criticality. Returns at most 6 items.

const DAY = 1000 * 60 * 60 * 24;

function daysUntil(target: string): number {
  return Math.ceil((new Date(target).getTime() - Date.now()) / DAY);
}

export type ExhibitorTodo = {
  id: string;
  urgent: boolean;
  title: string;
  meta: string;
  action: { label: string; route: string };
};

type TodoInternal = ExhibitorTodo & { _days: number | null };

export async function getExhibitorTodos(
  supabase: SupabaseClient,
  exhibitorId: string,
  userId: string
): Promise<{ todos: ExhibitorTodo[]; totalCount: number; urgentCount: number }> {
  const todos: TodoInternal[] = [];

  // --- 1. 書類の期限切れ対応 ---
  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select(
      "business_license_expiry, business_permit_expiry, pl_insurance_expiry, vehicle_inspection_expiry, fire_manager_expiry"
    )
    .eq("id", exhibitorId)
    .maybeSingle();
  if (exhibitor) {
    const expiries: { label: string; date: string }[] = [
      { label: "営業許可証", date: exhibitor.business_permit_expiry },
      { label: "営業許可証", date: exhibitor.business_license_expiry },
      { label: "PL保険", date: exhibitor.pl_insurance_expiry },
      { label: "車検証", date: exhibitor.vehicle_inspection_expiry },
      { label: "防火管理者", date: exhibitor.fire_manager_expiry },
    ].filter((e) => e.date);
    const within = expiries
      .map((e) => ({ ...e, d: daysUntil(e.date) }))
      .filter((e) => e.d <= 30);
    if (within.length > 0) {
      const nearest = within.reduce((a, b) => (b.d < a.d ? b : a));
      todos.push({
        id: "expiring-documents",
        urgent: nearest.d <= 14,
        title: `${nearest.label}の更新が必要`,
        meta: nearest.d < 0 ? `${nearest.label}・期限切れ` : `${nearest.label}・残り${nearest.d}日`,
        action: { label: "更新", route: "/profile" },
        _days: nearest.d,
      });
    }
  }

  // --- 2. 当日情報の確認（承認済み・開催が近いイベント） ---
  const { data: approvedApps } = await supabase
    .from("event_applications")
    .select("id, event:events(id, event_name, event_start_date)")
    .eq("exhibitor_id", exhibitorId)
    .eq("status", "approved");
  for (const app of (approvedApps ?? []) as any[]) {
    const ev = app.event;
    if (!ev?.event_start_date) continue;
    const d = daysUntil(ev.event_start_date);
    if (d >= 0 && d <= 7) {
      todos.push({
        id: `meeting-${app.id}`,
        urgent: d <= 3,
        title: `「${ev.event_name}」当日情報を確認`,
        meta: `開催まで残り${d}日`,
        action: { label: "確認", route: `/applications/${app.id}` },
        _days: d,
      });
    }
  }

  // --- 3. 主催者からのお知らせ（未読通知） ---
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if ((unreadCount ?? 0) > 0) {
    todos.push({
      id: "unread-notifications",
      urgent: false,
      title: "主催者からのお知らせ",
      meta: `未読 ${unreadCount}件`,
      action: { label: "開く", route: "/notifications" },
      _days: null,
    });
  }

  todos.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    const ad = a._days ?? Infinity;
    const bd = b._days ?? Infinity;
    return ad - bd;
  });

  const urgentCount = todos.filter((t) => t.urgent).length;
  const todoList: ExhibitorTodo[] = todos.slice(0, 6).map((t) => ({
    id: t.id,
    urgent: t.urgent,
    title: t.title,
    meta: t.meta,
    action: t.action,
  }));

  return { todos: todoList, totalCount: todos.length, urgentCount };
}
