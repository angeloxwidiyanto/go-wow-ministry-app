"use client";

import { useState, useTransition, useEffect } from "react";
import { createNewPersonAction, mergePersonAction, searchPeopleAction, bulkCreateNewPersonsAction } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";

type Attendee = {
  id: string;
  registration_number: string;
  attendee_name: string;
  attendee_whatsapp: string | null;
  attendee_email: string | null;
  church_title: string | null;
  gender: string | null;
  birth_date: string | null;
  origin_church: string | null;
  ministry_role: string | null;
  created_at: string;
  registration_orders: { events: { title: string } };
};

type Person = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp_number: string | null;
};

type Props = {
  pendingAttendees: Attendee[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export default function PendingContactsClient({ pendingAttendees, currentPage, totalPages, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  
  // Bulk Actions State
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<string>>(new Set());

  // Merge Modal State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  
  // Server-Side Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    if (!mergeModalOpen) return;
    
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const result = await searchPeopleAction(searchQuery);
      if (result.data) {
        setSearchResults(result.data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, mergeModalOpen]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/pending-contacts?${params.toString()}`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAttendeeIds(new Set(pendingAttendees.map(a => a.id)));
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

  const handleBulkCreate = () => {
    if (selectedAttendeeIds.size === 0) return;
    
    const attendeesToCreate = pendingAttendees.filter(a => selectedAttendeeIds.has(a.id));
    
    setErrorMsg("");
    startTransition(async () => {
      const result = (await bulkCreateNewPersonsAction(attendeesToCreate)) as any;
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setSelectedAttendeeIds(new Set()); // clear selection
      }
    });
  };

  const handleCreateNew = (attendee: Attendee) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await createNewPersonAction(attendee);
      if (result?.error) {
        setErrorMsg(result.error);
      }
    });
  };

  const openMergeModal = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setSearchQuery(attendee.attendee_name); // Pre-fill to trigger auto-search
    setSearchResults([]);
    setMergeModalOpen(true);
  };

  const handleMerge = (personId: string) => {
    if (!selectedAttendee) return;
    setErrorMsg("");
    startTransition(async () => {
      const result = await mergePersonAction(selectedAttendee.id, personId);
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setMergeModalOpen(false);
        setSelectedAttendee(null);
      }
    });
  };

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline text-zinc-900 mb-2">Pending Contacts</h1>
          <p className="text-zinc-500 font-body">Review attendees that do not match an existing CRM contact. ({totalCount} total)</p>
        </div>

        {selectedAttendeeIds.size > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-sm font-semibold text-primary bg-purple-50 px-3 py-1.5 rounded-lg">
              {selectedAttendeeIds.size} selected
            </span>
            <button 
              onClick={handleBulkCreate}
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              {isPending ? "Creating..." : "Bulk Add as New Persons"}
            </button>
          </div>
        )}
      </header>

      {errorMsg && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 mb-6">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-zinc-300 accent-primary cursor-pointer"
                    checked={pendingAttendees.length > 0 && selectedAttendeeIds.size === pendingAttendees.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Attendee Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {pendingAttendees.map((attendee) => (
                <tr key={attendee.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 accent-primary cursor-pointer"
                      checked={selectedAttendeeIds.has(attendee.id)}
                      onChange={() => handleSelectOne(attendee.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-900">{attendee.attendee_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Reg: {attendee.registration_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700 font-medium">{attendee.attendee_whatsapp || "No WA"}</p>
                    <p className="text-xs text-zinc-500">{attendee.attendee_email || "No Email"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700 max-w-[200px] truncate">{attendee.registration_orders?.events?.title || "Unknown Event"}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{new Date(attendee.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => openMergeModal(attendee)}
                      disabled={isPending}
                      className="px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    >
                      Merge to Existing
                    </button>
                    <button 
                      onClick={() => handleCreateNew(attendee)}
                      disabled={isPending}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Add as New
                    </button>
                  </td>
                </tr>
              ))}

              {pendingAttendees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">You're all caught up!</h3>
                    <p className="text-xs">Every recent attendee has been successfully mapped to the CRM.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-zinc-50 border-t border-zinc-100 p-4 flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Prev
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                className="px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                Next
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Merge Modal */}
      {mergeModalOpen && selectedAttendee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
              <h3 className="text-xl font-headline font-semibold text-zinc-900">Merge Contact</h3>
              <button 
                onClick={() => {
                  setMergeModalOpen(false);
                  setSelectedAttendee(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-zinc-600 mb-4">
                Who does <strong className="text-zinc-900">{selectedAttendee.attendee_name}</strong> belong to in your database?
              </p>

              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Search existing CRM members by name..."
                  autoFocus
                />
                {isSearching && (
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin text-sm">
                    refresh
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto min-h-[150px]">
                {searchResults.map(person => (
                  <div key={person.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl hover:border-primary/30 hover:bg-purple-50/30 transition-colors group">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{person.full_name}</p>
                      <p className="text-xs text-zinc-500">{person.whatsapp_number || person.email || "No contact info"}</p>
                    </div>
                    <button 
                      onClick={() => handleMerge(person.id)}
                      disabled={isPending}
                      className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      {isPending ? "Merging..." : "Merge Here"}
                    </button>
                  </div>
                ))}

                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-200 rounded-xl">
                    <span className="material-symbols-outlined text-3xl mb-2 text-zinc-300">person_search</span>
                    <p>No matching CRM members found.</p>
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-8 text-zinc-400 text-sm">
                    Type at least 2 characters to search your database...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
