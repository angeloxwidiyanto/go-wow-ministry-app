"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, bulkUpdateOrderStatusAction } from "./actions";

type Attendee = {
  id: string;
  order_id: string;
  registration_number: string;
  attendee_name: string;
  attendee_email: string | null;
  attendee_whatsapp: string | null;
  church_title: string | null;
  ministry_role: string | null;
  registration_type: string;
  created_at: string;
  attended_at: string | null;
  status: string;
  event_id: string;
  pic_name: string | null;
  ticket_tier_name: string | null;
};

export default function EventAttendeesClient({ eventTitle, attendees }: { eventTitle: string, attendees: Attendee[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<string>>(new Set());

  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch = a.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.attendee_email && a.attendee_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.attendee_whatsapp && a.attendee_whatsapp.includes(searchQuery)) ||
      a.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.pic_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && a.status === statusFilter;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAttendeeIds(new Set(filteredAttendees.map(a => a.id)));
    } else {
      setSelectedAttendeeIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedAttendeeIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAttendeeIds(newSet);
  };

  // Helper to extract unique order IDs from selected attendees
  const getSelectedOrderIdsAndEventId = () => {
    const selectedAttendees = attendees.filter(a => selectedAttendeeIds.has(a.id));
    const orderIds = Array.from(new Set(selectedAttendees.map(a => a.order_id)));
    const eventId = selectedAttendees.length > 0 ? selectedAttendees[0].event_id : "";
    return { orderIds, eventId };
  };

  const handleBulkMarkPaid = () => {
    const { orderIds, eventId } = getSelectedOrderIdsAndEventId();
    if (orderIds.length === 0) return;

    startTransition(async () => {
      await bulkUpdateOrderStatusAction(orderIds, "PAID", eventId);
      setSelectedAttendeeIds(new Set());
      router.refresh();
    });
  };

  const handleBulkCancel = () => {
    const { orderIds, eventId } = getSelectedOrderIdsAndEventId();
    if (orderIds.length === 0) return;

    if (!confirm("Are you sure you want to cancel these orders?")) return;

    startTransition(async () => {
      await bulkUpdateOrderStatusAction(orderIds, "CANCELLED", eventId);
      setSelectedAttendeeIds(new Set());
      router.refresh();
    });
  };

  const handleUpdateStatus = (orderId: string, status: string, eventId: string) => {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, status, eventId);
      router.refresh();
    });
  };

  const exportToCSV = () => {
    const headers = [
      "No", "Registration No", "Attendee Name", "Gender",
      "WhatsApp", "Email", "Origin Church", "Ministry Role",
      "Ticket Type", "PIC Name", "Payment Status", "Registered At"
    ];

    const rows = filteredAttendees.map((a, idx) => [
      idx + 1,
      a.registration_number,
      a.attendee_name,
      a.gender || "",
      a.attendee_whatsapp || "",
      a.attendee_email || "",
      a.origin_church || "",
      a.ministry_role || "",
      a.registration_type || "",
      (a.pic_name || ""),
      a.status,
      new Date(a.created_at).toLocaleDateString("id-ID")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell =>
          // Wrap in quotes and escape inner quotes
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendees-${eventTitle.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm text-primary hover:underline flex items-center gap-1 mb-4 font-semibold w-max">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Events
          </Link>
          <h1 className="text-4xl font-headline text-zinc-900 mb-2">Registered Attendees</h1>
          <p className="text-zinc-500 font-body">Viewing all registrations for: <strong className="text-zinc-900">{eventTitle}</strong></p>
        </div>

        {selectedAttendeeIds.size > 0 ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-sm font-semibold text-primary bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
              {selectedAttendeeIds.size} selected
            </span>
            <button 
              onClick={handleBulkMarkPaid}
              disabled={isPending}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {isPending ? "Processing..." : "Mark as Paid"}
            </button>
            <button 
              onClick={handleBulkCancel}
              disabled={isPending}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel Orders
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                search
              </span>
              <input
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Search attendees or PIC..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button 
              className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
              onClick={exportToCSV}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        )}
      </header>

      <div className="bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)]">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between rounded-t-xl">
          <span className="text-sm font-semibold text-zinc-700">Total Registered: {attendees.length}</span>
        </div>
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-zinc-300 accent-primary cursor-pointer"
                    checked={filteredAttendees.length > 0 && selectedAttendeeIds.size === filteredAttendees.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Attendee Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Ticket Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right whitespace-nowrap">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredAttendees.map((a) => {
                const status = a.status;
                return (
                  <tr key={a.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 accent-primary cursor-pointer"
                        checked={selectedAttendeeIds.has(a.id)}
                        onChange={() => handleSelectOne(a.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                        {a.attendee_name}
                        {status === "PAID" && (
                          <span className="material-symbols-outlined text-emerald-500 text-[16px]" title="Paid">check_circle</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{a.origin_church || "No church"} {a.ministry_role ? `• ${a.ministry_role}` : ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-700 font-medium">{a.attendee_whatsapp || "No WA"}</p>
                      <p className="text-xs text-zinc-500 break-all">{a.attendee_email || "No Email"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-mono text-zinc-900 font-medium">{a.registration_number}</p>
                      <p className="text-xs text-zinc-500">PIC: {(a.pic_name || "")}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        {status === "PAID" && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Paid
                          </span>
                        )}
                        {status === "PENDING" && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        )}
                        {status === "CANCELLED" && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Cancelled
                          </span>
                        )}

                        {/* Inline Actions */}
                        <div className="relative group inline-block">
                          <button className="p-1 text-zinc-400 hover:text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">more_vert</span>
                          </button>
                          <div className="absolute right-0 top-full w-40 bg-white border border-zinc-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col py-1">
                            <button 
                              onClick={() => window.open(`/invoice/${a.order_id}`, '_blank')}
                              className="px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
                            >
                              {status === "PAID" ? "View E-Ticket" : "View Invoice"}
                            </button>
                            <div className="h-px bg-zinc-100 my-1"></div>
                            {status !== "PAID" && (
                              <button 
                                onClick={() => handleUpdateStatus(a.order_id, "PAID", a.event_id)}
                                className="px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                              >
                                Mark as Paid
                              </button>
                            )}
                            {status !== "PENDING" && (
                              <button 
                                onClick={() => handleUpdateStatus(a.order_id, "PENDING", a.event_id)}
                                className="px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
                              >
                                Mark as Pending
                              </button>
                            )}
                            {status !== "CANCELLED" && (
                              <button 
                                onClick={() => handleUpdateStatus(a.order_id, "CANCELLED", a.event_id)}
                                className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAttendees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">search_off</span>
                    <p>No attendees found matching your search.</p>
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
