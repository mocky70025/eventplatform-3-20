import type { SupabaseClient } from "@supabase/supabase-js";

// Dashboard TODO list. Detection logic per design/SESSION_SUMMARY.md section 4.
// Sort: urgent first, then by time-criticality (fewer days left first),
// then by count (more first). Returns at most 6 items.

const DAY = 1000 * 60 * 60 * 24;

// Calendar days from now until `target` (negative = already past).
function daysUntil(target: string): number {
  return Math.ceil((new Date(target).getTime() - Date.now()) / DAY);
}

export type DashboardTodo = {
  id: string;
  type: string;
  urgent: boolean;
  title: string;
  meta: string;
  badge: string;
  action: { label: string; route: string };
  count: number;
};

type TodoInternal = DashboardTodo & {
  // internal sort key (smaller = more urgent); null = no deadline
  _days: number | null;
};

export async function getDashboardTodos(
  supabase: SupabaseClient,
  organizerId: string
): Promise<{ todos: DashboardTodo[]; totalCount: number; urgentCount: number }> {
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, event_name, event_start_date, application_period_end, recruit_count, max_exhibitors, status, meeting_info_sent"
    )
    .eq("organizer_id", organizerId);

  const eventList = events ?? [];
  const eventIds = eventList.map((e) => e.id);
  const todos: TodoInternal[] = [];

  if (eventIds.length > 0) {
    const { data: applications } = await supabase
      .from("event_applications")
      .select("id, event_id, exhibitor_id, status, created_at")
      .in("event_id", eventIds);
    const apps = applications ?? [];

    // --- 1. 新規申請を確認 ---
    const pending = apps.filter((a) => a.status === "pending");
    if (pending.length > 0) {
      const oldestAge = Math.max(
        ...pending.map((a) =>
          Math.floor((Date.now() - new Date(a.created_at).getTime()) / DAY)
        )
      );
      const urgent = oldestAge >= 3 || pending.length >= 5;
      todos.push({
        id: "new-applications",
        type: "new_applications",
        urgent,
        title: "新規申請を確認",
        meta:
          oldestAge >= 3
            ? `${pending.length}件の未対応申請・最長${oldestAge}日経過`
            : `${pending.length}件の未対応申請`,
        badge: `${pending.length}件`,
        action: { label: "確認", route: "/applications?status=pending" },
        count: pending.length,
        _days: urgent ? Math.max(0, 3 - oldestAge) : null,
      });
    }

    // --- 3. 募集締切が近い ---
    const approvedByEvent = new Map<string, number>();
    for (const a of apps) {
      if (a.status === "approved") {
        approvedByEvent.set(
          a.event_id,
          (approvedByEvent.get(a.event_id) ?? 0) + 1
        );
      }
    }
    const closing = eventList
      .filter((e) => e.status === "published" && e.application_period_end)
      .map((e) => ({ e, d: daysUntil(e.application_period_end as string) }))
      .filter(({ e, d }) => {
        if (d < 0 || d > 14) return false;
        const cap = e.recruit_count ?? e.max_exhibitors ?? 0;
        // no cap set -> still surface; otherwise only if slots remain
        return cap === 0 || cap - (approvedByEvent.get(e.id) ?? 0) > 0;
      });
    if (closing.length > 0) {
      const nearest = Math.min(...closing.map((c) => c.d));
      todos.push({
        id: "closing-deadline",
        type: "closing_deadline",
        urgent: nearest <= 3,
        title: "募集締切が近い",
        meta: `${closing.length}件のイベント・最短あと${nearest}日`,
        badge: `${closing.length}件`,
        action: { label: "編集", route: "/events" },
        count: closing.length,
        _days: nearest,
      });
    }

    // --- 2. 書類の期限切れ対応 ---
    const approvedExhibitorIds = [
      ...new Set(
        apps.filter((a) => a.status === "approved").map((a) => a.exhibitor_id)
      ),
    ];
    if (approvedExhibitorIds.length > 0) {
      const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select(
          "id, business_license_expiry, business_permit_expiry, pl_insurance_expiry, vehicle_inspection_expiry, fire_manager_expiry"
        )
        .in("id", approvedExhibitorIds);
      let expiringCount = 0;
      let nearest: number | null = null;
      for (const ex of exhibitors ?? []) {
        const within = [
          ex.business_license_expiry,
          ex.business_permit_expiry,
          ex.pl_insurance_expiry,
          ex.vehicle_inspection_expiry,
          ex.fire_manager_expiry,
        ]
          .filter((d): d is string => Boolean(d))
          .map((d) => daysUntil(d))
          .filter((d) => d <= 30); // includes already-expired (negative)
        if (within.length > 0) {
          expiringCount++;
          const m = Math.min(...within);
          nearest = nearest === null ? m : Math.min(nearest, m);
        }
      }
      if (expiringCount > 0) {
        todos.push({
          id: "expiring-documents",
          type: "expiring_documents",
          urgent: nearest !== null && nearest <= 14,
          title: "書類の期限切れ対応",
          meta: `${expiringCount}件の出店者・最短あと${nearest}日`,
          badge: `${expiringCount}件`,
          action: { label: "確認", route: "/applications?status=approved" },
          count: expiringCount,
          _days: nearest,
        });
      }
    }
  }

  // --- 5. 当日情報の未共有 ---
  const meetingPending = eventList
    .filter((e) => !e.meeting_info_sent && e.event_start_date)
    .map((e) => ({ e, d: daysUntil(e.event_start_date as string) }))
    .filter(({ d }) => d >= 0 && d <= 7);
  if (meetingPending.length > 0) {
    const nearest = Math.min(...meetingPending.map((m) => m.d));
    todos.push({
      id: "meeting-info",
      type: "meeting_info",
      urgent: nearest <= 3,
      title: "当日情報の未共有",
      meta: `${meetingPending.length}件のイベント・最短あと${nearest}日`,
      badge: `${meetingPending.length}件`,
      action: { label: "共有", route: "/events" },
      count: meetingPending.length,
      _days: nearest,
    });
  }

  // Sort: urgent -> normal, then time-criticality (asc, no-deadline last),
  // then count (desc).
  todos.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    const ad = a._days ?? Infinity;
    const bd = b._days ?? Infinity;
    if (ad !== bd) return ad - bd;
    return b.count - a.count;
  });

  const urgentCount = todos.filter((t) => t.urgent).length;
  const todoList: DashboardTodo[] = todos.slice(0, 6).map((t) => ({
    id: t.id,
    type: t.type,
    urgent: t.urgent,
    title: t.title,
    meta: t.meta,
    badge: t.badge,
    action: t.action,
    count: t.count,
  }));

  return { todos: todoList, totalCount: todos.length, urgentCount };
}
