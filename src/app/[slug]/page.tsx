import { apiFetch } from "@/utils/api";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60; // Cache for 60 seconds

const THEMES: Record<string, string> = {
  purple: "from-purple-900 via-purple-800 to-indigo-900",
  blue: "from-blue-900 via-blue-800 to-cyan-900",
  emerald: "from-emerald-900 via-teal-800 to-teal-900",
  rose: "from-rose-900 via-rose-800 to-pink-900",
  amber: "from-amber-900 via-orange-800 to-orange-900",
  slate: "from-slate-900 via-zinc-800 to-zinc-900",
};

export default async function EventLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  let event: any;
  try {
    event = await apiFetch(`/api/events/slug/${resolvedParams.slug}`);
  } catch (error) {
    notFound();
  }

  if (!event || !event.is_published) {
    notFound();
  }

  // Fetch child events safely if it's a series parent
  let childEvents: any[] = [];
  if (event.event_type === 'SERIES_PARENT') {
    try {
      const allEvents: any[] = await apiFetch("/api/events");
      childEvents = allEvents
        .filter(e => e.parent_event_id === event.id && e.is_published)
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    } catch (e) {
      console.error("Failed to fetch child events:", e);
    }
  }

  const eventDate = new Date(event.event_date);
  const eventEndDate = event.event_end_date ? new Date(event.event_end_date) : null;
  const isPast = eventEndDate ? (eventEndDate < new Date()) : (eventDate < new Date());
  
  const themeGradient = THEMES[event.theme_color || "purple"] || THEMES["purple"];

  const formatIDDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-zinc-50 relative pb-24 scroll-smooth">
      {/* Fixed Navbar with Glassmorphism */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
             <img src="/logo.png" alt="WoW Logo" className="w-32 md:w-40 h-auto object-contain" />
          </div>
          <Link href="/admin/events" className="text-sm font-semibold text-zinc-600 hover:text-primary transition-colors bg-white/50 px-4 py-2 rounded-full shadow-sm border border-zinc-200/50">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* 100vh Immersive Hero Section */}
      <header className="relative w-full h-[85vh] min-h-[600px] flex items-end justify-center overflow-hidden">
        {/* Background Image or Gradient */}
        {event.cover_image_url ? (
          <>
            <img 
              src={event.cover_image_url} 
              alt={`${event.title} Cover`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10`} />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient}`} />
        )}

        {/* Hero Content contained inside Frosted Glass floating directly on the hero */}
        <div className="relative z-10 max-w-5xl w-full px-6 pb-20 pt-32">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl text-white transform transition-all duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-semibold mb-6 border border-white/30 backdrop-blur-md shadow-inner">
              <span className="material-symbols-outlined text-sm">
                {event.event_type === 'SERIES_PARENT' ? 'style' : 'event'}
              </span>
              <span>{event.event_type === 'SERIES_PARENT' ? 'Tour / Event Series' : 'Upcoming Event'}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 tracking-tight leading-tight">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap gap-8 text-white/90 mt-8">
              {event.event_type !== 'SERIES_PARENT' ? (
                <div className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{formatIDDate(eventDate)}</p>
                    <p className="text-white/70 text-sm font-medium">
                      {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      {eventEndDate && ` - ${eventEndDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-2xl">event_available</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg">Select a session below</p>
                    <p className="text-white/70 text-sm font-medium">Multiple dates available</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                  <span className="material-symbols-outlined text-2xl">location_on</span>
                </div>
                <div>
                  <p className="font-bold text-lg">{event.location || "Multiple Locations"}</p>
                  <p className="text-white/70 text-sm font-medium">Venue / City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16 relative z-20">
        
        {/* Description / About */}
        {event.description && (
          <section className="prose prose-lg prose-zinc max-w-none text-zinc-600 bg-white p-10 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <h2 className="text-2xl font-headline font-bold text-zinc-900 mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">info</span>
              About This Event
            </h2>
            <p className="leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </section>
        )}

        {/* Dynamic Content Blocks */}
        {event.content_blocks && event.content_blocks.length > 0 && (
          <section className="space-y-8">
            {event.content_blocks.map((block: any, idx: number) => (
              <div key={idx} className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
                {block.type === "text" && (
                  <div className="prose prose-lg prose-zinc max-w-none">
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>
                  </div>
                )}
                {block.type === "quote" && (
                  <blockquote className="border-l-4 border-primary pl-6 py-4 my-4 italic text-zinc-800 text-2xl font-serif bg-primary/5 rounded-r-2xl shadow-sm">
                    "{block.content}"
                  </blockquote>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Series Children Display */}
        {event.event_type === 'SERIES_PARENT' ? (
          <section className="scroll-mt-32" id="tickets">
            <h2 className="text-4xl font-headline font-bold text-zinc-900 mb-8 text-center border-b pb-6">Available Sessions & Cities</h2>
            <div className="space-y-4">
              {childEvents.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center text-zinc-500 shadow-sm flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-6xl mb-4 text-zinc-300">event_busy</span>
                  <p className="text-lg">No upcoming sessions have been scheduled yet.</p>
                </div>
              ) : (
                childEvents.map((child) => {
                   const childDate = new Date(child.event_date);
                   const isChildPast = new Date() > childDate;
                   return (
                    <div key={child.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 group">
                      <div className="flex items-center gap-6 w-full">
                        <div className="w-24 h-24 rounded-2xl bg-primary/5 flex flex-col items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-inner">
                          <span className="text-2xl font-bold uppercase">{childDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-3xl font-black leading-none mt-1">{childDate.getDate()}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-zinc-900 mb-2 truncate max-w-sm">{child.title}</h3>
                          <p className="text-zinc-500 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                            {child.location || 'Location TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        {isChildPast ? (
                          <div className="px-6 py-4 bg-zinc-100 text-zinc-500 font-semibold rounded-xl text-center w-full uppercase tracking-wider text-sm border border-zinc-200">Session Ended</div>
                        ) : (
                          <Link href={`/${child.slug}`} className="block px-8 py-4 bg-zinc-900 hover:bg-primary text-white font-bold rounded-xl text-center transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 w-full flex items-center justify-center gap-2">
                            View details
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          /* Single Event Ticket Tiers */
          event.ticket_tiers && event.ticket_tiers.length > 0 && (
            <section className="scroll-mt-32" id="tickets">
              <h2 className="text-4xl font-headline font-bold text-zinc-900 mb-8 text-center border-b pb-6">Ticket Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.ticket_tiers.map((tier: any) => (
                  <div key={tier.id} className="relative p-8 border border-zinc-200 rounded-3xl bg-white hover:border-primary/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-zinc-50 rounded-bl-full -z-10 group-hover:bg-primary/5 group-hover:scale-125 transition-all duration-500"></div>
                    <div>
                      <h4 className="text-2xl font-bold text-zinc-900">{tier.name}</h4>
                      {tier.description && (
                         <p className="text-zinc-500 mt-2 mb-6 leading-relaxed bg-white/80">{tier.description}</p>
                      )}
                      <div className="text-4xl font-headline font-black text-primary mt-4 tracking-tight">
                        {tier.price === 0 ? "Free" : `Rp ${tier.price.toLocaleString('id-ID')}`}
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-zinc-100 text-sm text-zinc-600 font-medium space-y-3 bg-white/80">
                       {tier.min_qty > 1 && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-xl">group</span> Minimum {tier.min_qty} tickets required</p>}
                       {tier.max_qty && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-xl">person_off</span> Maximum {tier.max_qty} tickets allowed</p>}
                       {tier.capacity && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-amber-500 text-xl">hourglass_empty</span> Strictly limited slots</p>}
                       {(!tier.min_qty || tier.min_qty <= 1) && !tier.max_qty && !tier.capacity && <p className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span> Tickets Available</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        )}
      </main>

      {/* Sticky Bottom Call-To-Action (For Single Events) */}
      {event.event_type !== 'SERIES_PARENT' && !isPast && (
        <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-zinc-200/50 p-4 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] translate-y-0 transition-transform duration-500">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block pl-6">
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-0.5">Ready to join?</p>
              <h3 className="text-xl font-bold text-zinc-900 truncate max-w-sm lg:max-w-md">{event.title}</h3>
            </div>
            <Link 
              href={`/${event.slug}/register`}
              className="w-full md:w-auto px-10 py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-xl hover:bg-primary hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-lg whitespace-nowrap"
            >
              Reserve Your Spot
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* Past Event Banner */}
      {isPast && (
         <div className="fixed bottom-0 w-full bg-zinc-100 border-t border-zinc-200 p-4 z-50 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <span className="material-symbols-outlined text-zinc-400 text-3xl align-middle mr-3">history</span>
           <span className="text-zinc-600 font-semibold text-xl align-middle">This event has already ended.</span>
         </div>
      )}
    </div>
  );
}
