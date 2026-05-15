import { apiFetch } from "@/utils/api";
import Link from "next/link";

export const revalidate = 0;

type DashboardStats = {
  total_members: number;
  total_events: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_attendees: number;
};

type UpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  is_published: boolean;
};

type RecentOrder = {
  id: string;
  pic_name: string;
  pic_email: string;
  status: string;
  total_tickets: number;
  created_at: string;
  event_title: string | null;
};

export default async function AdminDashboardPage() {
  // Single analytics call replaces 7 parallel Supabase queries
  let stats: DashboardStats = {
    total_members: 0,
    total_events: 0,
    total_orders: 0,
    pending_orders: 0,
    total_revenue: 0,
    total_attendees: 0,
  };
  let upcomingEvents: UpcomingEvent[] = [];
  let recentOrders: RecentOrder[] = [];

  try {
    [stats, upcomingEvents, recentOrders] = await Promise.all([
      apiFetch<DashboardStats>("/api/analytics/dashboard"),
      apiFetch<UpcomingEvent[]>("/api/events").then((evts) =>
        (evts as any[])
          .filter((e) => new Date(e.event_date) >= new Date())
          .sort(
            (a, b) =>
              new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
          )
          .slice(0, 4)
      ),
      apiFetch<RecentOrder[]>("/api/orders").then((orders) =>
        (orders as any[]).slice(0, 8)
      ),
    ]);
  } catch (e) {
    console.error("Failed to fetch dashboard data from Go API:", e);
  }

  const statCards = [
    {
      label: "Total Members",
      value: stats.total_members,
      icon: "group",
      color: "bg-purple-50 text-primary",
      badge: null,
      href: "/admin/members",
    },
    {
      label: "Total Events",
      value: stats.total_events,
      icon: "event",
      color: "bg-blue-50 text-blue-600",
      badge: null,
      href: "/admin/events",
    },
    {
      label: "Total Attendees",
      value: stats.total_attendees,
      icon: "confirmation_number",
      color: "bg-emerald-50 text-emerald-600",
      badge: null,
      href: "/admin/orders",
    },
    {
      label: "Pending Payments",
      value: stats.pending_orders,
      icon: "pending_actions",
      color: "bg-amber-50 text-amber-600",
      badge: stats.pending_orders > 0 ? "Needs action" : null,
      href: "/admin/orders",
    },
  ];

  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
    CANCELLED: "bg-red-50 text-red-700 border border-red-100",
  };

  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Overview</h1>
        <p className="text-zinc-500 font-body">
          Peace be with you. Here is the operational health of your ministry today.
        </p>
      </header>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white p-6 rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 hover:border-purple-200 hover:shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.12)] transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              {card.badge && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-3xl font-headline text-zinc-900 mb-1 group-hover:text-primary transition-colors">
              {card.value.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Upcoming Events + Recent Orders */}
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming Events */}
          <section className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h2 className="text-lg font-headline text-zinc-900">Upcoming Events</h2>
              <Link href="/admin/events" className="text-xs font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400">
                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                <p className="text-sm">No upcoming events scheduled.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {upcomingEvents.map((evt) => {
                  const date = new Date(evt.event_date);
                  const daysUntil = Math.ceil(
                    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={evt.id} className="flex items-center gap-5 px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                      <div className="w-14 h-14 shrink-0 rounded-xl bg-purple-50 border border-purple-100 flex flex-col items-center justify-center text-primary">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                          {date.toLocaleString("default", { month: "short" })}
                        </span>
                        <span className="text-xl font-headline leading-none">{date.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{evt.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {evt.location || "Location TBD"} ·{" "}
                          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          daysUntil <= 3
                            ? "bg-red-50 text-red-600"
                            : daysUntil <= 7
                            ? "bg-amber-50 text-amber-600"
                            : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                        </span>
                        <Link
                          href={`/admin/events/${evt.id}/attendees`}
                          className="p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Attendees"
                        >
                          <span className="material-symbols-outlined text-lg">group</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Registrations */}
          <section className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h2 className="text-lg font-headline text-zinc-900">Recent Registrations</h2>
              <span className="text-xs text-zinc-400 font-medium">Last 8 orders</span>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p className="text-sm">No registrations yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">PIC Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tickets</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="text-sm font-semibold text-zinc-900">{order.pic_name}</p>
                          <p className="text-[10px] text-zinc-400">{order.pic_email}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-sm text-zinc-700 max-w-[160px] truncate">
                            {order.event_title || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-mono font-medium text-zinc-700">{order.total_tickets}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyles[order.status] || "bg-zinc-100 text-zinc-500"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs text-zinc-400">
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: Revenue + Scripture */}
        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100">
              <h2 className="text-lg font-headline text-zinc-900">Revenue</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Confirmed</p>
                <p className="text-2xl font-headline text-zinc-900">{formatIDR(stats.total_revenue)}</p>
              </div>
              <div className="h-px bg-zinc-100" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Total Orders</p>
                  <p className="text-lg font-headline text-zinc-900">{stats.total_orders}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Pending</p>
                  <p className="text-lg font-headline text-amber-600">{stats.pending_orders}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Scripture quote */}
          <section className="bg-zinc-900 p-8 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-purple-400 text-4xl mb-4">format_quote</span>
              <p className="font-headline italic text-lg leading-relaxed mb-6">
                &ldquo;Let all that you do be done in love.&rdquo;
              </p>
              <div className="h-px w-12 bg-purple-500/50 mb-4" />
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">
                1 Corinthians 16:14
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          </section>
        </div>
      </div>
    </>
  );
}
