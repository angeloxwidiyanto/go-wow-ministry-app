import { apiFetch } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;

export default async function EventsPage() {
  const allEvents = await apiFetch<any[]>("/api/events") || [];
  
  // Filter for published, top-level events, sorted ascending by date
  const events = allEvents
    .filter(e => e.is_published && !e.parent_event_id)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());


  const now = new Date();
  const upcoming = (events || []).filter(e => new Date(e.event_date) >= now);
  const past = (events || []).filter(e => new Date(e.event_date) < now);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-ID", {
      weekday: "short", day: "numeric", month: "long", year: "numeric"
    });

  const EventCard = ({ event }: { event: any }) => {
    const isPast = new Date(event.event_date) < now;
    return (
      <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${isPast ? 'opacity-70' : ''}`}>
        {/* Cover */}
        <div className="relative h-48 bg-gradient-to-br from-purple-600 to-indigo-700 overflow-hidden">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="material-symbols-outlined text-white text-8xl">church</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {event.event_type === "SERIES_PARENT" && (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                Series
              </span>
            )}
            {isPast ? (
              <span className="px-2.5 py-1 bg-black/40 text-white/70 text-xs font-semibold rounded-full">Past Event</span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full">Upcoming</span>
            )}
          </div>

          {/* Date overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/80 text-xs font-semibold mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formatDate(event.event_date)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h2 className="text-lg font-headline font-bold text-zinc-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
            {event.title}
          </h2>
          {event.description && (
            <p className="text-sm text-zinc-500 line-clamp-2 mb-3 flex-1">{event.description}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-zinc-400 mb-4">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span className="truncate">{event.location || "Location TBD"}</span>
          </div>
          
          {!isPast ? (
            <Link
              href={`/${event.slug}`}
              className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              View & Register
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          ) : (
            <Link
              href={`/${event.slug}`}
              className="w-full py-2.5 bg-zinc-100 text-zinc-600 text-sm font-semibold rounded-xl text-center hover:bg-zinc-200 transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700 mb-4 transition-colors">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-zinc-900 mb-3">Events</h1>
            <p className="text-zinc-500 text-lg max-w-lg">
              Discover gatherings, workshops, and worship events from WoW Ministry.
            </p>
          </div>
          <Link
            href="/my-ticket"
            className="shrink-0 flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
            Find My Ticket
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xl font-headline font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full" />
              Upcoming Events
              <span className="ml-1 text-sm font-normal text-zinc-400">({upcoming.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-headline font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-zinc-300 rounded-full" />
              Past Events
              <span className="ml-1 text-sm font-normal text-zinc-400">({past.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {(events || []).length === 0 && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">event_busy</span>
            <h3 className="text-lg font-semibold text-zinc-500">No events published yet</h3>
            <p className="text-zinc-400 text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
