"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateOrderStatusAction } from "./actions";

type Order = {
  id: string;
  pic_name: string;
  pic_email: string;
  pic_whatsapp: string;
  total_tickets: number;
  total_amount: number;
  discount_amount: number;
  applied_voucher: string | null;
  payment_method?: string | null;
  payment_proof_url: string | null;
  status: "PENDING" | "PAID" | "CANCELLED";
  created_at: string;
  events: {
    id: string;
    title: string;
    slug: string;
    event_date: string;
  } | null;
};

const STATUS_FILTERS = ["ALL", "PENDING", "PAID", "CANCELLED"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.pic_name.toLowerCase().includes(q) ||
      o.pic_email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.events?.title.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    PAID: orders.filter((o) => o.status === "PAID").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingRevenue = orders
    .filter((o) => o.status === "PENDING")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, newStatus);
    });
  };

  const statusBadge = (status: string) => {
    if (status === "PAID") return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Paid
      </span>
    );
    if (status === "PENDING") return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Cancelled
      </span>
    );
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Orders</h1>
        <p className="text-zinc-500 font-body">All registration orders across every event.</p>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-3xl font-headline font-bold text-zinc-900">{orders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Awaiting Payment</p>
          <p className="text-3xl font-headline font-bold text-zinc-900">{counts.PENDING}</p>
          <p className="text-xs text-zinc-400 mt-1">{formatIDR(pendingRevenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Confirmed Revenue</p>
          <p className="text-2xl font-headline font-bold text-zinc-900">{formatIDR(totalRevenue)}</p>
          <p className="text-xs text-zinc-400 mt-1">{counts.PAID} paid orders</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Cancelled</p>
          <p className="text-3xl font-headline font-bold text-zinc-900">{counts.CANCELLED}</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s} <span className="ml-1 opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Search by name, email, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">PIC / Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-900">{order.pic_name}</p>
                    <p className="text-xs text-zinc-500">{order.pic_email}</p>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">#{order.id.split("-")[0].toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.events ? (
                      <>
                        <p className="text-sm font-medium text-zinc-900 max-w-[180px] truncate">{order.events.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{new Date(order.events.event_date).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Unknown event</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-zinc-900">{order.total_tickets} tickets</p>
                    <p className="text-xs text-zinc-500 font-medium">
                      {formatIDR(order.total_amount)}
                      {order.discount_amount > 0 && (
                        <span className="ml-1 text-emerald-600">(-{formatIDR(order.discount_amount)})</span>
                      )}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-700 font-medium">{order.payment_method || "Not specified"}</p>
                    {order.applied_voucher && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-primary border border-purple-100 rounded text-[10px] font-mono font-bold">
                        {order.applied_voucher}
                      </span>
                    )}
                    {order.payment_proof_url && (
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 hover:underline"
                        title="View payment proof"
                      >
                        <span className="material-symbols-outlined text-[12px]">receipt</span>
                        Proof Submitted
                      </a>
                    )}
                    <p className="text-[10px] text-zinc-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/invoice/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                      </a>

                      {/* Status quick-action dropdown */}
                      <div className="relative group inline-block">
                        <button
                          className="p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                          disabled={isPending}
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                        <div className="absolute right-0 top-full w-44 bg-white border border-zinc-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col py-1">
                          {order.events && (
                            <>
                              <Link
                                href={`/admin/events/${order.events.id}/attendees`}
                                className="px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 font-medium flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[16px]">group</span>
                                View Attendees
                              </Link>
                              <div className="h-px bg-zinc-100 my-1" />
                            </>
                          )}
                          {order.status !== "PAID" && (
                            <button
                              onClick={() => handleStatusChange(order.id, "PAID")}
                              className="px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-medium flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Mark as Paid
                            </button>
                          )}
                          {order.status !== "PENDING" && (
                            <button
                              onClick={() => handleStatusChange(order.id, "PENDING")}
                              className="px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 font-medium flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
                              Mark as Pending
                            </button>
                          )}
                          {order.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleStatusChange(order.id, "CANCELLED")}
                              className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl text-zinc-300">receipt_long</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">No Orders Found</h3>
                    <p className="text-xs">
                      {searchQuery || statusFilter !== "ALL" ? "Try adjusting your filters." : "Registrations will appear here once attendees sign up."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
