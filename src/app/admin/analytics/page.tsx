import { apiFetch } from "@/utils/api";
import AnalyticsClient from "./AnalyticsClient";

export const revalidate = 0;

type Order = {
  id: string;
  status: string;
  total_tickets: number;
  total_amount: number;
  created_at: string;
  event_id: string;
  event_title?: string;
};

type Event = {
  id: string;
  title: string;
  event_date: string;
  is_published: boolean;
};

type AnalyticsSummary = {
  total_members: number;
  total_revenue: number;
  pending_orders: number;
  gender_distribution?: Record<string, number>;
  church_distribution?: Record<string, number>;
  role_distribution?: Record<string, number>;
};

export default async function AnalyticsPage() {
  let orders: Order[] = [];
  let events: Event[] = [];
  let summary: AnalyticsSummary = {
    total_members: 0,
    total_revenue: 0,
    pending_orders: 0,
  };

  try {
    [orders, events, summary] = await Promise.all([
      apiFetch<Order[]>("/api/orders"),
      apiFetch<Event[]>("/api/events"),
      apiFetch<AnalyticsSummary>("/api/analytics/dashboard"),
    ]);
  } catch (e) {
    console.error("Failed to fetch analytics data:", e);
  }

  // ── Payment Distribution ──────────────────────────────────────
  const paymentMap: Record<string, number> = { PAID: 0, PENDING: 0, CANCELLED: 0 };
  orders.forEach((o) => {
    paymentMap[o.status] = (paymentMap[o.status] || 0) + 1;
  });
  const paymentDist = Object.entries(paymentMap).map(([status, count]) => ({
    status,
    count,
  }));

  // ── Gender Distribution (from analytics summary) ──────────────
  const genderDist = Object.entries(summary.gender_distribution ?? {}).map(
    ([gender, count]) => ({ gender, count })
  );

  // ── Church Stats (from analytics summary) ────────────────────
  const churchStats = Object.entries(summary.church_distribution ?? {})
    .map(([name, members]) => ({ name, members, participations: 0, events: 0 }))
    .sort((a, b) => b.members - a.members);

  // ── Ministry Role Distribution ────────────────────────────────
  const roleStats = Object.entries(summary.role_distribution ?? {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 10);

  // ── Event Performance ─────────────────────────────────────────
  const eventPerfMap: Record<
    string,
    {
      id: string;
      title: string;
      event_date: string;
      is_published: boolean;
      totalRegistrations: number;
      paid: number;
      pending: number;
      cancelled: number;
      totalTickets: number;
    }
  > = {};

  events.forEach((e) => {
    eventPerfMap[e.id] = {
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      is_published: e.is_published,
      totalRegistrations: 0,
      paid: 0,
      pending: 0,
      cancelled: 0,
      totalTickets: 0,
    };
  });

  orders.forEach((o) => {
    if (!eventPerfMap[o.event_id]) return;
    eventPerfMap[o.event_id].totalRegistrations++;
    eventPerfMap[o.event_id].totalTickets += o.total_tickets || 0;
    if (o.status === "PAID") eventPerfMap[o.event_id].paid++;
    else if (o.status === "PENDING") eventPerfMap[o.event_id].pending++;
    else if (o.status === "CANCELLED") eventPerfMap[o.event_id].cancelled++;
  });

  const eventPerf = Object.values(eventPerfMap).sort(
    (a, b) =>
      new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  // ── Monthly Registrations ─────────────────────────────────────
  const monthLabels: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(
      d.toLocaleString("default", { month: "short", year: "2-digit" })
    );
  }
  const monthMap: Record<string, number> = {};
  monthLabels.forEach((m) => { monthMap[m] = 0; });
  orders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in monthMap) monthMap[key]++;
  });
  const monthStats = monthLabels.map((month) => ({
    month: month.split(" ")[0],
    registrations: monthMap[month],
  }));

  const totalAttendees = summary.total_members;
  const totalRevenuePaid = summary.total_revenue;

  return (
    <AnalyticsClient
      data={{
        paymentDist,
        genderDist,
        eventPerf,
        churchStats,
        roleStats,
        monthStats,
        totalAttendees,
        totalRevenuePaid,
      }}
    />
  );
}
