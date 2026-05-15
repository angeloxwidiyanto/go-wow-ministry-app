"use client";

import { useState } from "react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  event_date: string;
  location: string | null;
  is_published: boolean;
  event_type: string;
  parent_event_id: string | null;
  created_at: string;
};

export default function EventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events] = useState<Event[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter((evt) =>
    evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (evt.location && evt.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline text-zinc-900 mb-2">Events Management</h1>
          <p className="text-zinc-500 font-body">Create, manage, and monitor registration for all your church events.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search events..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link 
            href="/admin/events/create"
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Event
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">event</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{evt.title}</p>
                        <a 
                          href={`/${evt.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          /{evt.slug}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700 font-medium">
                      {new Date(evt.event_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(evt.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700 max-w-[200px] truncate">{evt.location || "Online / TBD"}</p>
                  </td>
                  <td className="px-6 py-4">
                    {evt.is_published ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Published
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/events/${evt.id}/edit`}
                      className="inline-block p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit Event"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </Link>
                    <Link 
                      href={`/admin/events/${evt.id}/attendees`}
                      className="inline-block p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors ml-1"
                      title="View Attendees"
                    >
                      <span className="material-symbols-outlined text-lg">group</span>
                    </Link>
                    <Link 
                      href={`/admin/events/${evt.id}/check-in`}
                      className="inline-block p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors ml-1"
                      title="Check-In Desk"
                    >
                      <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl text-zinc-300">event_busy</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">No Events Found</h3>
                    <p className="text-xs">Click "Create Event" to schedule your first gathering.</p>
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
