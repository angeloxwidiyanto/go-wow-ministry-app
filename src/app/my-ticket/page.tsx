"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { lookupTicketAction } from "./actions";

type Order = {
  id: string;
  pic_name: string;
  pic_email: string;
  pic_whatsapp: string;
  total_tickets: number;
  total_amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    location: string;
    slug: string;
  } | null;
};

const statusConfig = {
  PAID: { label: "Confirmed", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  PENDING: { label: "Awaiting Payment", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  CANCELLED: { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
};

export default function MyTicketPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Order[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResults(null);
    setHasSearched(true);

    startTransition(async () => {
      const res = await lookupTicketAction(query);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.orders) {
        setResults(res.orders as unknown as Order[]);
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700 mb-5 transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            All Events
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">confirmation_number</span>
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-zinc-900 mb-1">Find My Ticket</h1>
              <p className="text-zinc-500 text-sm">Enter the email or WhatsApp number you used when registering.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 w-full flex-1">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-8">
          <label className="block text-sm font-semibold text-zinc-700 mb-3">
            Email Address or WhatsApp Number
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. john@example.com or +62 812..."
                className="w-full pl-9 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors"
                disabled={isPending}
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {isPending ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">search</span>
              )}
              {isPending ? "Searching..." : "Find"}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            🔒 We only use this to look up your registration. Your data is not stored by this search.
          </p>
        </form>

        {/* Error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
            <div>
              <p className="font-semibold text-sm">Not Found</p>
              <p className="text-sm">{errorMsg}</p>
              <p className="text-xs text-red-500 mt-2">
                Try a different search term, or contact us via WhatsApp for assistance.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-500 mb-4">{results.length} registration{results.length > 1 ? 's' : ''} found</p>
            <div className="space-y-4">
              {results.map((order) => {
                const status = statusConfig[order.status] || statusConfig.PENDING;
                const invoiceUrl = `/invoice/${order.id}`;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Status ribbon */}
                    <div className={`h-1 w-full ${order.status === 'PAID' ? 'bg-emerald-500' : order.status === 'CANCELLED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-semibold text-zinc-900 text-base">
                            {order.events?.title || "Unknown Event"}
                          </h3>
                          {order.events && (
                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                              {new Date(order.events.event_date).toLocaleDateString("en-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                        <div>
                          <p className="text-xs text-zinc-400 mb-0.5">Booked by</p>
                          <p className="font-medium text-zinc-800">{order.pic_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 mb-0.5">Tickets</p>
                          <p className="font-medium text-zinc-800">{order.total_tickets} ticket{order.total_tickets > 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 mb-0.5">Total</p>
                          <p className="font-medium text-zinc-800">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(order.total_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 mb-0.5">Order ID</p>
                          <p className="font-mono text-xs text-zinc-600">#{order.id.split("-")[0].toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                          {order.status === "PAID" ? "View E-Ticket" : "View Invoice"}
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}${invoiceUrl}`)}
                          className="px-4 py-2.5 bg-zinc-100 text-zinc-600 text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                          title="Copy link"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state after search */}
        {hasSearched && !isPending && !errorMsg && (!results || results.length === 0) && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-zinc-300 block mb-3">search_off</span>
            <p className="text-zinc-500 font-medium">No results for "{query}"</p>
          </div>
        )}

        {/* Help note */}
        {!hasSearched && (
          <div className="bg-zinc-100 rounded-2xl p-5 text-sm text-zinc-600">
            <p className="font-semibold text-zinc-700 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              Can't find your ticket?
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-500">
              <li>• Try searching with the email used during registration</li>
              <li>• Or search with your WhatsApp number (include country code, e.g. +62)</li>
              <li>• Contact us via WhatsApp and share your name and the event</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
