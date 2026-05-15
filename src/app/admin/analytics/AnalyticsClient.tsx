"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────
type PaymentDist = { status: string; count: number };
type GenderDist = { gender: string; count: number };
type EventPerf = {
  id: string;
  title: string;
  event_date: string;
  is_published: boolean;
  totalRegistrations: number;
  paid: number;
  pending: number;
  cancelled: number;
  totalTickets: number;
};
type ChurchStat = { name: string; members: number; participations: number; events: number };
type RoleStat = { name: string; count: number };
type MonthStat = { month: string; registrations: number };

type AnalyticsData = {
  paymentDist: PaymentDist[];
  genderDist: GenderDist[];
  eventPerf: EventPerf[];
  churchStats: ChurchStat[];
  roleStats: RoleStat[];
  monthStats: MonthStat[];
  totalAttendees: number;
  totalRevenuePaid: number;
};

// ── Donut Chart (pure SVG) ───────────────────────────────────────
function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;

  let cumulativePercent = 0;
  const slices = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = cumulativePercent * 360 - 90;
    cumulativePercent += pct;
    return { ...seg, pct, dash, gap, rotation };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={0}
            transform={`rotate(${s.rotation} ${cx} ${cy})`}
            className="transition-all duration-700"
          />
        ))}
        <circle cx={cx} cy={cy} r={49} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-zinc-900" style={{ fontSize: 22, fontWeight: 700, fontFamily: "inherit" }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-zinc-400" style={{ fontSize: 10, fontFamily: "inherit" }}>
          total
        </text>
      </svg>
      <div className="space-y-2.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-zinc-600">{s.label}</span>
            <span className="text-xs font-bold text-zinc-900 ml-auto pl-3">{s.value}</span>
            <span className="text-[10px] text-zinc-400 w-10 text-right">{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ─────────────────────────────────────────
function HBarChart({ items, max }: { items: { label: string; value: number }[]; max: number }) {
  const colors = ["bg-primary", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500", "bg-orange-500"];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-700 truncate max-w-[180px]" title={item.label}>{item.label}</span>
            <span className="text-xs font-bold text-zinc-900 ml-2 shrink-0">{item.value}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Month Trend Bars ─────────────────────────────────────────────
function BarTrend({ months }: { months: MonthStat[] }) {
  const maxVal = Math.max(...months.map((m) => m.registrations), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {months.map((m) => {
        const pct = (m.registrations / maxVal) * 100;
        return (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              {m.registrations}
            </span>
            <div
              className="w-full bg-primary/20 rounded-t-md relative overflow-hidden transition-all duration-700 hover:bg-primary/40 cursor-default"
              style={{ height: `${Math.max(pct, 4)}%` }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md"
                style={{ height: "100%" }}
              />
            </div>
            <span className="text-[9px] text-zinc-400">{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const [eventFilter, setEventFilter] = useState<"all" | "paid" | "pending">("all");

  const paymentTotal = data.paymentDist.reduce((s, d) => s + d.count, 0);
  const genderTotal = data.genderDist.reduce((s, d) => s + d.count, 0);

  const paymentSegments = [
    { label: "Paid", value: data.paymentDist.find((d) => d.status === "PAID")?.count ?? 0, color: "#10b981" },
    { label: "Pending", value: data.paymentDist.find((d) => d.status === "PENDING")?.count ?? 0, color: "#f59e0b" },
    { label: "Cancelled", value: data.paymentDist.find((d) => d.status === "CANCELLED")?.count ?? 0, color: "#ef4444" },
  ];

  const genderSegments = [
    { label: "Male", value: data.genderDist.find((d) => d.gender === "Male")?.count ?? 0, color: "#6d28d9" },
    { label: "Female", value: data.genderDist.find((d) => d.gender === "Female")?.count ?? 0, color: "#a78bfa" },
    { label: "Unknown", value: data.genderDist.find((d) => !["Male","Female"].includes(d.gender))?.count ?? 0, color: "#e4e4e7" },
  ];

  const filteredEvents = data.eventPerf.filter((e) => {
    if (eventFilter === "paid") return e.paid > 0;
    if (eventFilter === "pending") return e.pending > 0;
    return true;
  });

  const statusDot: Record<string, string> = {
    true: "bg-emerald-500",
    false: "bg-zinc-300",
  };

  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Analytics</h1>
        <p className="text-zinc-500 font-body">
          Deep-dive insights into registrations, churches, and ministry engagement.
        </p>
      </header>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: "Total Registrations", value: paymentTotal, icon: "confirmation_number", color: "bg-purple-50 text-primary" },
          { label: "Total Attendees", value: data.totalAttendees, icon: "person_check", color: "bg-blue-50 text-blue-600" },
          { label: "Paid Orders", value: paymentSegments[0].value, icon: "payments", color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending Orders", value: paymentSegments[1].value, icon: "schedule", color: "bg-amber-50 text-amber-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-6 rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100">
            <div className={`inline-flex p-2.5 rounded-xl mb-4 ${k.color}`}>
              <span className="material-symbols-outlined">{k.icon}</span>
            </div>
            <p className="text-3xl font-headline text-zinc-900 mb-1">{k.value.toLocaleString()}</p>
            <p className="text-sm text-zinc-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 1: Donuts + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Payment Distribution */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Payment Status</h3>
          <DonutChart segments={paymentSegments} total={paymentTotal} />
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Gender Breakdown</h3>
          <DonutChart segments={genderSegments} total={genderTotal} />
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Registrations by Month</h3>
          {data.monthStats.every((m) => m.registrations === 0) ? (
            <div className="flex items-center justify-center h-32 text-zinc-300">
              <p className="text-sm">No registration data yet</p>
            </div>
          ) : (
            <BarTrend months={data.monthStats} />
          )}
        </div>
      </div>

      {/* ── Row 2: Event Performance Table ── */}
      <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h3 className="text-lg font-headline text-zinc-900">Event Performance</h3>
          <div className="flex items-center gap-2">
            {(["all", "paid", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEventFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${
                  eventFilter === f ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {filteredEvents.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-400">
            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
            <p className="text-sm">No events match this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Attendees</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredEvents.map((evt) => {
                  const fillPct = evt.totalRegistrations > 0
                    ? Math.round((evt.paid / evt.totalRegistrations) * 100)
                    : 0;
                  return (
                    <tr key={evt.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-zinc-900 max-w-[200px] truncate">{evt.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-zinc-600">
                          {new Date(evt.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-zinc-900">{evt.totalRegistrations}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-zinc-900">{evt.totalTickets}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-emerald-600">{evt.paid}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-amber-600">{evt.pending}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold w-max px-2 py-1 rounded-full ${evt.is_published ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[String(evt.is_published)]}`} />
                          {evt.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500">{fillPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Row 3: Churches + Ministry Roles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Churches */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">
            Most Active Churches
          </h3>
          {data.churchStats.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">No church data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Church</th>
                    <th className="pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Members</th>
                    <th className="pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Events</th>
                    <th className="pb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Reg.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {data.churchStats.slice(0, 8).map((c, i) => (
                    <tr key={c.name} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 w-5">#{i + 1}</span>
                          <span className="text-sm font-medium text-zinc-800 truncate max-w-[140px]" title={c.name}>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-bold text-zinc-900">{c.members}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-zinc-600">{c.events}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs font-bold text-primary bg-purple-50 px-2 py-0.5 rounded">{c.participations}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ministry Role Distribution */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] border border-zinc-100 p-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">
            Ministry Role Distribution
          </h3>
          {data.roleStats.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-300">
              <p className="text-sm">No ministry roles assigned yet.</p>
            </div>
          ) : (
            <HBarChart
              items={data.roleStats.map((r) => ({ label: r.name, value: r.count }))}
              max={data.roleStats[0]?.count ?? 1}
            />
          )}
        </div>
      </div>
    </>
  );
}
