import { apiFetch } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600; // revalidate hourly

export default async function HomePage() {
  // Fetch upcoming published events (top 3)
  const allEvents = await apiFetch<any[]>("/api/events") || [];
  const now = new Date();
  
  const upcomingEvents = allEvents
    .filter(e => e.is_published && !e.parent_event_id && new Date(e.event_date) >= now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);


  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-zinc-50 font-body">

      {/* NAV */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">church</span>
            </div>
            <div>
              <p className="text-sm font-headline font-bold text-zinc-900 leading-none">WoW Ministry</p>
              <p className="text-[10px] text-zinc-400">Wonders of Worship</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/events" className="text-sm font-semibold text-zinc-600 hover:text-primary transition-colors hidden sm:block">
              Events
            </Link>
            <Link href="/my-ticket" className="text-sm font-semibold text-zinc-600 hover:text-primary transition-colors hidden sm:block">
              My Ticket
            </Link>
            <Link
              href="/events"
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Register Now
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-[-50%] translate-y-[-50%]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl translate-x-[30%] translate-y-[30%]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-40 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/80 text-xs font-semibold rounded-full border border-white/20 mb-8 backdrop-blur-sm">
            Wonders of Worship Ministry
          </span>
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight">
            Experience the<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">
              Wonder of God
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join our gatherings, workshops, and worship events. Discover your place in a community that magnifies God together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/events"
              className="px-8 py-4 bg-white text-purple-900 font-bold text-base rounded-2xl hover:bg-purple-50 transition-colors shadow-xl"
            >
              Browse All Events
            </Link>
            <Link
              href="/my-ticket"
              className="px-8 py-4 bg-white/10 text-white font-semibold text-base rounded-2xl border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Find My Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">What's Coming</p>
              <h2 className="text-4xl font-headline font-bold text-zinc-900">Upcoming Events</h2>
            </div>
            <Link href="/events" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              View All
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/${event.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-44 bg-gradient-to-br from-purple-600 to-indigo-700 overflow-hidden">
                  {event.cover_image_url ? (
                    <Image src={event.cover_image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="material-symbols-outlined text-white text-7xl">church</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full">
                    Upcoming
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-headline font-bold text-zinc-900 text-lg mb-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                    {formatDate(event.event_date)}
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {event.location || "Location TBD"}
                  </p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      Register Now
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES SECTION */}
      <section className="bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">How It Works</p>
            <h2 className="text-4xl font-headline font-bold text-zinc-900">Register in Minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "search", step: "01", title: "Find Your Event", desc: "Browse our upcoming events and worship gatherings from the events page." },
              { icon: "assignment", step: "02", title: "Complete Registration", desc: "Fill in your details and your group's info. Voucher codes are supported for discounts." },
              { icon: "confirmation_number", step: "03", title: "Get Your E-Ticket", desc: "Receive your invoice with QR codes instantly. Save the link — that's your entry pass." },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
                </div>
                <p className="text-xs font-bold text-zinc-300 mb-2">{step}</p>
                <h3 className="text-lg font-headline font-bold text-zinc-900 mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Already Registered?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              Lost your ticket link? Look up your registration using your email or WhatsApp number.
            </p>
            <Link
              href="/my-ticket"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 font-bold rounded-2xl hover:bg-purple-50 transition-colors shadow-xl"
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              Find My Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">church</span>
            </div>
            <p className="text-sm font-semibold text-zinc-800">WoW Ministry</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
            <Link href="/my-ticket" className="hover:text-primary transition-colors">My Ticket</Link>
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} Wonders of Worship Ministry</p>
        </div>
      </footer>

    </div>
  );
}
