"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Scanner } from "@yudiel/react-qr-scanner";
import { checkInAttendeeAction, searchAttendeesAction } from "./actions";

export default function CheckInClient({ 
  event, 
  initialTotal, 
  initialCheckedIn 
}: { 
  event: any, 
  initialTotal: number, 
  initialCheckedIn: number 
}) {
  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");
  const [checkedInCount, setCheckedInCount] = useState(initialCheckedIn);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleScan = useCallback(async (result: any) => {
    if (!result || isProcessing) return;
    
    // Most QR scanners return an array of objects for multi-code reading, or a string
    const qrValue = result[0]?.rawValue || result.text || (typeof result === 'string' ? result : null);
    if (!qrValue) return;

    setIsProcessing(true);
    setErrorMsg("");

    const response = await checkInAttendeeAction(qrValue, event.id);

    if (response.error) {
      setErrorMsg(response.error);
      if (response.alreadyCheckedIn) {
         setLastCheckIn(response.attendee);
      }
    } else if (response.success) {
      setCheckedInCount(prev => prev + 1);
      setLastCheckIn(response.attendee);
      // Automatically clear the success message after 3 seconds for continuous scanning
      setTimeout(() => setLastCheckIn(null), 3000);
    }

    // Small delay to prevent double scanning
    setTimeout(() => setIsProcessing(false), 1500);
  }, [event.id, isProcessing]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsProcessing(true);
    setErrorMsg("");
    setSearchResults([]);

    const res = await searchAttendeesAction(event.id, searchQuery);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setSearchResults(res.data);
    }
    setIsProcessing(false);
  };

  const handleManualCheckIn = async (attendeeId: string) => {
    setIsProcessing(true);
    setErrorMsg("");

    const response = await checkInAttendeeAction(attendeeId, event.id);

    if (response.error) {
      setErrorMsg(response.error);
    } else if (response.success) {
      setCheckedInCount(prev => prev + 1);
      setLastCheckIn(response.attendee);
      // Update local search results
      setSearchResults(prev => prev.map(a => a.id === attendeeId ? { ...a, attended_at: new Date().toISOString() } : a));
    }

    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <header className="mb-10">
        <Link href={`/admin/events/${event.id}/attendees`} className="text-sm text-primary hover:underline flex items-center gap-1 mb-4 font-semibold w-max">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Attendees
        </Link>
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Check-In Desk</h1>
        <p className="text-zinc-500 font-body">{event.title}</p>
      </header>

      {/* Live Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center">
          <span className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Attendees</span>
          <span className="text-4xl font-headline font-bold text-zinc-900">{initialTotal}</span>
        </div>
        <div className="bg-primary/10 p-6 rounded-2xl shadow-sm border border-primary/20 flex flex-col items-center justify-center text-primary">
          <span className="text-sm font-semibold uppercase tracking-wider mb-1">Checked In</span>
          <span className="text-4xl font-headline font-bold">{checkedInCount}</span>
        </div>
      </div>

      {/* Status Overlay */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined shrink-0">error</span>
          <div>
            <p className="font-bold text-sm">Check-in Failed</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      {lastCheckIn && !errorMsg && (
        <div className="mb-6 p-6 bg-emerald-500 text-white border border-emerald-600 rounded-2xl flex flex-col items-center justify-center shadow-lg transform transition-all animate-in fade-in zoom-in duration-300">
          <span className="material-symbols-outlined text-5xl mb-2">check_circle</span>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">Check-in Successful</p>
          <p className="text-3xl font-headline font-bold mt-1 text-center">{lastCheckIn.attendee_name}</p>
          <p className="text-emerald-100 mt-2 bg-emerald-600/50 px-3 py-1 rounded-lg text-sm">{lastCheckIn.registration_type} Ticket • {lastCheckIn.registration_number}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden border border-zinc-100">
        <div className="flex border-b border-zinc-100">
          <button 
            onClick={() => setActiveTab("scan")}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "scan" ? "bg-zinc-50 text-primary border-b-2 border-primary" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            <span className="material-symbols-outlined align-middle mr-2 text-[18px]">qr_code_scanner</span>
            Scan QR Code
          </button>
          <button 
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "manual" ? "bg-zinc-50 text-primary border-b-2 border-primary" : "text-zinc-500 hover:bg-zinc-50"}`}
          >
            <span className="material-symbols-outlined align-middle mr-2 text-[18px]">keyboard</span>
            Manual Entry
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === "scan" ? (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black relative border-4 border-zinc-100 shadow-inner">
                {!isProcessing && (
                  <Scanner 
                     onScan={handleScan}
                     formats={['qr_code']}
                  />
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                    <span className="material-symbols-outlined text-white animate-spin text-4xl mb-2">progress_activity</span>
                    <span className="text-white text-sm font-semibold">Processing...</span>
                  </div>
                )}
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-0"></div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
                   <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative">
                     <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg -translate-x-1 -translate-y-1"></div>
                     <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg translate-x-1 -translate-y-1"></div>
                     <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg -translate-x-1 translate-y-1"></div>
                     <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg translate-x-1 translate-y-1"></div>
                   </div>
                </div>
              </div>
              <p className="text-center text-zinc-500 text-sm mt-6">
                Point the camera at the attendee's E-Ticket QR Code.
              </p>
            </div>
          ) : (
            <div>
              <form onSubmit={handleManualSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or registration code..."
                    className="w-full pl-9 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isProcessing || !searchQuery}
                  className="px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((attendee) => (
                    <div key={attendee.id} className="p-4 border border-zinc-200 rounded-xl flex items-center justify-between bg-zinc-50">
                      <div>
                        <p className="font-semibold text-zinc-900">{attendee.attendee_name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{attendee.registration_type} • {attendee.registration_number}</p>
                      </div>
                      <div>
                        {attendee.attended_at ? (
                           <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px]">check_circle</span> Checked In
                           </span>
                        ) : (
                          <button 
                            onClick={() => handleManualCheckIn(attendee.id)}
                            disabled={isProcessing}
                            className="text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:text-primary hover:border-primary/50 px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && searchQuery && !isProcessing && (
                <p className="text-center text-sm text-zinc-500 py-6">No matching attendees found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
