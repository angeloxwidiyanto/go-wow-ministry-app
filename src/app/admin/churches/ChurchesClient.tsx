"use client";

import { useState } from "react";

type ChurchGroup = {
  churchName: string;
  count: number;
  members: {
    id: string;
    full_name: string;
    email: string | null;
    whatsapp_number: string | null;
    person_roles: { ministry_roles: { name: string } }[];
    event_attendees: {
      registration_orders: {
        events: { id: string; title: string; event_date: string } | null;
      } | null;
    }[];
  }[];
  eventHistory: {
    id: string;
    title: string;
    event_date: string;
    attendeeCount: number;
  }[];
};

export default function ChurchesClient({ churches }: { churches: ChurchGroup[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter by church name OR any member's name within the church
  const filteredChurches = churches.filter((group) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (group.churchName.toLowerCase().includes(q)) return true;
    return group.members.some((m) => m.full_name.toLowerCase().includes(q));
  });

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline text-zinc-900 mb-2">Churches Directory</h1>
          <p className="text-zinc-500 font-body">
            View which churches have been reached, how many attendees, and which events they participated in.
          </p>
        </div>

        <div className="relative w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
            placeholder="Search church name or member..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </header>

      {searchQuery && (
        <p className="text-sm text-zinc-500 mb-4">
          Showing <strong className="text-zinc-900">{filteredChurches.length}</strong> result{filteredChurches.length !== 1 && "s"} for &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      <div className="space-y-6">
        {filteredChurches.map((group, idx) => {
          // If searching, highlight only matching members; otherwise show all
          const displayedMembers = searchQuery
            ? group.members.filter(
                (m) =>
                  m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  group.churchName.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : group.members;

          return (
            <details
              key={group.churchName}
              className="group bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden [&_summary::-webkit-details-marker]:hidden"
              open={idx === 0 || !!searchQuery}
            >
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer bg-white hover:bg-zinc-50 transition-colors list-none">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">church</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{group.churchName}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm text-zinc-500">
                        {searchQuery ? `${displayedMembers.length} / ` : ""}
                        {group.count} Member{group.count !== 1 && "s"}
                      </p>
                      {group.eventHistory.length > 0 && (
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 font-semibold px-2 py-0.5 rounded-full">
                          {group.eventHistory.length} Event{group.eventHistory.length !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-400 group-open:rotate-180 transition-transform duration-300">
                  expand_more
                </span>
              </summary>

              <div className="border-t border-zinc-100">
                {/* Event History strip */}
                {group.eventHistory.length > 0 && (
                  <div className="px-6 py-5 bg-purple-50/50 border-b border-zinc-100">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                      Event Participation History
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.eventHistory.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-primary text-sm">event_available</span>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900">{event.title}</p>
                            <p className="text-[10px] text-zinc-400">
                              {new Date(event.event_date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              {" · "}{event.attendeeCount} attendee{event.attendeeCount !== 1 && "s"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Member Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ministry Role</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Events Attended</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {displayedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                                <img
                                  alt={member.full_name}
                                  className="w-full h-full object-cover"
                                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.full_name.replace(/\s+/g, "")}`}
                                />
                              </div>
                              <p className="text-sm font-semibold text-zinc-900">{member.full_name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-zinc-700 font-medium">{member.whatsapp_number || "No WA"}</p>
                            <p className="text-xs text-zinc-500">{member.email || "No Email"}</p>
                          </td>
                          <td className="px-6 py-4">
                            {member.person_roles && member.person_roles.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {member.person_roles.map((pr, ridx) => (
                                  <span key={ridx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                                    {pr.ministry_roles.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {member.event_attendees && member.event_attendees.filter(att => att.registration_orders?.events).length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {member.event_attendees
                                  .filter((att) => att.registration_orders?.events)
                                  .map((att, eidx) => (
                                    <span
                                      key={eidx}
                                      title={new Date(att.registration_orders!.events!.event_date).toLocaleDateString()}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 truncate max-w-[150px]"
                                    >
                                      {att.registration_orders!.events!.title}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">No events</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          );
        })}

        {filteredChurches.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3">search_off</span>
            <h3 className="text-lg font-semibold text-zinc-900">No Results Found</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {searchQuery
                ? `No church or member matches "${searchQuery}". Try a different search.`
                : "No church data yet. Add members with their origin church to see them here."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
