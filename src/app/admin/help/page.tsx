"use client";

import React, { useState } from "react";

type Section = {
  id: string;
  icon: string;
  title: string;
  color: string;
  articles: Article[];
};

type Article = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: "getting-started",
    icon: "rocket_launch",
    title: "Getting Started",
    color: "bg-purple-50 text-purple-600",
    articles: [
      {
        id: "overview",
        title: "What is the WoW Ministry Admin Dashboard?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>
              The <strong className="text-zinc-900">WoW Ministry Admin Dashboard</strong> is the central hub for managing everything related to the Wonders of Worship ministry — from members and churches to events and registrations.
            </p>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2">The Two Sides of the App</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="font-semibold text-zinc-800 text-sm mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-purple-500">admin_panel_settings</span>
                    Admin Dashboard
                  </p>
                  <p className="text-xs text-zinc-500">For ministry staff — manage members, events, registrations, and analytics.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="font-semibold text-zinc-800 text-sm mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-emerald-500">public</span>
                    Public Site
                  </p>
                  <p className="text-xs text-zinc-500">For attendees — browse events, register, and look up their e-ticket.</p>
                </div>
              </div>
            </div>
            <p>
              The sidebar on the left gives you access to all sections: <strong>Overview, Members, Churches, Events, Orders, Analytics,</strong> and <strong>Pending Contacts</strong>.
            </p>
          </div>
        ),
      },
      {
        id: "navigation",
        title: "How to navigate the dashboard",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Use the left sidebar to navigate between sections. The active page is highlighted in purple.</p>
            <div className="space-y-2">
              {[
                { icon: "dashboard", label: "Overview", desc: "See a bird's-eye view of all ministry stats, upcoming events, and recent orders." },
                { icon: "group", label: "Members", desc: "View, search, add, and import all registered people in the ministry database." },
                { icon: "church", label: "Churches", desc: "Track which churches are represented in your membership." },
                { icon: "event", label: "Events", desc: "Create and manage worship events, publish them, and track registrations." },
                { icon: "receipt_long", label: "Orders", desc: "View all registration orders across all events with their payment statuses." },
                { icon: "monitoring", label: "Analytics", desc: "Visualize trends, growth, and engagement across the ministry." },
                { icon: "merge", label: "Pending Contacts", desc: "Review and resolve unmatched contacts from event registrations." },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-zinc-800">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "events",
    icon: "event",
    title: "Managing Events",
    color: "bg-blue-50 text-blue-600",
    articles: [
      {
        id: "create-event",
        title: "How to create a new event",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Events</strong> in the sidebar, then click <strong>"New Event"</strong>. Fill in the event details:</p>
            <div className="space-y-2">
              {[
                { field: "Title", note: "The public-facing name of the event." },
                { field: "Slug", note: "Auto-generated URL identifier (e.g. /wow-concert-2025). Must be unique." },
                { field: "Date & Time", note: "When the event takes place." },
                { field: "Location", note: "Venue or address of the event." },
                { field: "Description", note: "Displayed on the public event page." },
                { field: "Cover Image", note: "Optional banner image URL for the event card." },
                { field: "Ticket Types", note: "Define ticket tiers (e.g. General, VIP) with pricing and seat limits." },
              ].map((r) => (
                <div key={r.field} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 w-28 shrink-0 mt-0.5">{r.field}</p>
                  <p className="text-xs text-zinc-600">{r.note}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">info</span>
              <p className="text-xs text-amber-700">Events are <strong>draft by default</strong>. They will not appear on the public site until you publish them.</p>
            </div>
          </div>
        ),
      },
      {
        id: "publish-event",
        title: "Publishing an event to the public",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Once the event details are ready, toggle the <strong>Published</strong> switch on the event page. This will make it visible on the public site at <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs">wowministry.com/[slug]</code>.</p>
            <p>Published events appear on:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>The public homepage (up to 3 upcoming events)</li>
              <li>The <strong>/events</strong> listing page</li>
              <li>The event's own direct page via its slug</li>
            </ul>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">check_circle</span>
              <p className="text-xs text-emerald-700">You can unpublish an event at any time. Existing registrations are not affected.</p>
            </div>
          </div>
        ),
      },
      {
        id: "attendees",
        title: "Viewing event attendees",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Events</strong>, find your event, and click the <strong className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span> attendees icon</strong>.</p>
            <p>The attendees page shows:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>All registered individuals (linked from registration orders)</li>
              <li>Their church, ticket type, and check-in status</li>
              <li>Payment status of their order (PAID / PENDING)</li>
            </ul>
            <p>You can also export the attendee list or confirm payments directly from this view.</p>
          </div>
        ),
      },
      {
        id: "check-in",
        title: "Using the Check-In scanner",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Events → [Event Name] → Check-In</strong>. This opens the live QR scanner mode.</p>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
                <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">qr_code_scanner</span>
                <p className="text-xs text-zinc-600">Scan the attendee's e-ticket QR code to instantly mark them as checked in.</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">warning</span>
                <p className="text-xs text-zinc-600">Only tickets with status <strong>PAID</strong> will be successfully checked in. PENDING tickets will show a warning.</p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "members",
    icon: "group",
    title: "Managing Members",
    color: "bg-violet-50 text-violet-600",
    articles: [
      {
        id: "add-member",
        title: "Adding a single member",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Members</strong> and click <strong>"Add Member"</strong>. Fill in the person's details:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>Full name (required)</li>
              <li>Email address</li>
              <li>WhatsApp / phone number</li>
              <li>Church affiliation</li>
              <li>Address</li>
            </ul>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-purple-500 text-lg shrink-0">lightbulb</span>
              <p className="text-xs text-purple-700">The system checks for <strong>duplicates</strong> by email and phone number to prevent double entries.</p>
            </div>
          </div>
        ),
      },
      {
        id: "bulk-import",
        title: "Bulk importing members via CSV",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>For large imports, use the <strong>Import CSV</strong> button on the Members page. The flow is:</p>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-600">
              <li>Download the <strong>CSV template</strong> to ensure correct column formatting.</li>
              <li>Fill in member data (name, email, phone, church, address).</li>
              <li>Upload the CSV — a preview table will appear for review.</li>
              <li>Optionally link all imported members to a <strong>past event</strong> (to backfill attendance data).</li>
              <li>Confirm and click <strong>Import</strong>. Duplicate detection runs automatically.</li>
            </ol>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">warning</span>
              <p className="text-xs text-amber-700">If a person with the same email or phone already exists, the import will <strong>link to the existing record</strong> rather than create a duplicate.</p>
            </div>
          </div>
        ),
      },
      {
        id: "search-filter",
        title: "Searching and filtering members",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>The Members page has a search bar and church filter. You can search by:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>Name</li>
              <li>Email address</li>
              <li>WhatsApp / phone number</li>
            </ul>
            <p>Use the <strong>Church</strong> dropdown to narrow results by church affiliation.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "registrations",
    icon: "receipt_long",
    title: "Registrations & Orders",
    color: "bg-amber-50 text-amber-600",
    articles: [
      {
        id: "attendee-flow",
        title: "How the public registration flow works",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>This is the journey an attendee takes from the public site:</p>
            <div className="space-y-3">
              {[
                { step: "1", icon: "search", title: "Browse Events", desc: "Attendee visits the public homepage or /events and finds a worship event." },
                { step: "2", icon: "assignment", title: "Fill Registration Form", desc: "They enter their name, email, WhatsApp, church, and select a ticket type and quantity." },
                { step: "3", icon: "confirmation_number", title: "Receive Invoice", desc: "An invoice page is generated with individual e-tickets (each has a unique QR code)." },
                { step: "4", icon: "upload", title: "Upload Payment Proof", desc: "For paid events, attendees upload their transfer proof on the invoice page." },
                { step: "5", icon: "check_circle", title: "Admin Confirms", desc: "The admin reviews the payment proof in Orders and sets status to PAID." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                  <div>
                    <p className="font-semibold text-zinc-800 text-sm">{s.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "order-statuses",
        title: "Understanding order statuses",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Every registration order has one of three statuses:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">PENDING</span>
                <p className="text-xs text-zinc-600">Payment has not been confirmed yet. The attendee may or may not have uploaded proof.</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">PAID</span>
                <p className="text-xs text-zinc-600">Payment confirmed. The ticket QR code is now valid for check-in.</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">CANCELLED</span>
                <p className="text-xs text-zinc-600">The order was cancelled. The ticket QR code is invalidated.</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "confirm-payment",
        title: "How to confirm a payment",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Orders</strong> in the sidebar. Find the order with status <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">PENDING</span>.</p>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-600">
              <li>Click on the order to open its details.</li>
              <li>Review the uploaded payment proof image (if provided).</li>
              <li>If payment is valid, click <strong>"Confirm Payment"</strong> → status changes to <span className="text-xs font-bold text-emerald-700">PAID</span>.</li>
              <li>The attendee's e-ticket QR code is now activated.</li>
            </ol>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">info</span>
              <p className="text-xs text-blue-700">You can also access pending payments directly from the <strong>Overview</strong> dashboard — the "Pending Payments" stat card links you there.</p>
            </div>
          </div>
        ),
      },
      {
        id: "find-ticket",
        title: "Helping an attendee find their ticket",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>If an attendee has lost their ticket link, direct them to the public <strong>/my-ticket</strong> page. They can look up their registration using:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>Their email address</li>
              <li>Their WhatsApp / phone number</li>
            </ul>
            <p>The system will return all matching orders and their invoice links. Each ticket in an order has its own unique QR code.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "churches",
    icon: "church",
    title: "Churches",
    color: "bg-emerald-50 text-emerald-600",
    articles: [
      {
        id: "what-churches",
        title: "What is the Churches section for?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>The <strong>Churches</strong> section tracks which church each member belongs to. This helps you understand the inter-church reach of WoW Ministry events.</p>
            <p>On the <strong>Overview</strong> dashboard, the <em>Top Churches</em> widget shows the churches with the most represented members and their event participation count.</p>
          </div>
        ),
      },
      {
        id: "add-church",
        title: "Adding a new church",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Churches</strong> and click <strong>"Add Church"</strong>. Enter the church name. It will then be available as an option when adding or importing members.</p>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-purple-500 text-lg shrink-0">lightbulb</span>
              <p className="text-xs text-purple-700">Churches can also be created on-the-fly during member import if a new church name is detected.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "pending-contacts",
    icon: "merge",
    title: "Pending Contacts",
    color: "bg-rose-50 text-rose-600",
    articles: [
      {
        id: "what-pending",
        title: "What are Pending Contacts?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>When someone registers for an event through the public site, the system tries to <strong>match them</strong> to an existing member record using their email or phone number.</p>
            <p>If no match is found, they appear as a <strong>Pending Contact</strong> — a person who registered but is not yet in the member database.</p>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-rose-500 text-lg shrink-0">info</span>
              <p className="text-xs text-rose-700">Keeping Pending Contacts resolved ensures your member database stays accurate and complete.</p>
            </div>
          </div>
        ),
      },
      {
        id: "resolve-pending",
        title: "How to resolve a Pending Contact",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Go to <strong>Pending Contacts</strong>. For each entry you can:</p>
            <div className="space-y-2">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
                <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">person_add</span>
                <div>
                  <p className="font-semibold text-zinc-800 text-sm">Create as New Member</p>
                  <p className="text-xs text-zinc-500">Add this person to the member database as a new entry.</p>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
                <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">merge</span>
                <div>
                  <p className="font-semibold text-zinc-800 text-sm">Merge with Existing</p>
                  <p className="text-xs text-zinc-500">Link this contact to an existing member record if it's a duplicate.</p>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
                <span className="material-symbols-outlined text-red-400 text-lg shrink-0">delete</span>
                <div>
                  <p className="font-semibold text-zinc-800 text-sm">Dismiss</p>
                  <p className="text-xs text-zinc-500">Remove the pending contact without creating a member entry.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "settings",
    icon: "settings",
    title: "Settings & Integrations",
    color: "bg-zinc-100 text-zinc-600",
    articles: [
      {
        id: "settings-overview",
        title: "What is the Settings page?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>
              The <strong>Settings</strong> page (accessible via the ⚙️ gear icon in the top bar) lets you configure
              third-party integrations for the WoW Ministry app.
            </p>
            <p>Currently available:</p>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-3">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">Fonnte — WhatsApp Notifications</p>
                <p className="text-xs text-zinc-500 mt-0.5">Automate WhatsApp messages for registrations and payment confirmations.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">info</span>
              <p className="text-xs text-amber-700">
                <strong>All integrations are optional.</strong> If none are configured, the app works fully in manual mode — no functionality is lost.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "fonnte-what",
        title: "What is Fonnte?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>
              <strong>Fonnte</strong> is an Indonesian WhatsApp gateway service. It lets you send WhatsApp messages
              programmatically using your own WhatsApp number as the sender.
            </p>
            <p>When connected, Fonnte enables the app to automatically send a WhatsApp message to attendees when:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500">
              <li>They complete a registration (sends invoice link via WA)</li>
              <li>Their payment is confirmed by admin (notifies them ticket is now active)</li>
            </ul>
            <div className="bg-zinc-900 rounded-xl p-4 text-xs text-zinc-300 font-mono leading-relaxed space-y-1">
              <p className="text-zinc-500 mb-2">{"// Example WA message sent on registration"}</p>
              <p>{"Halo [Nama Peserta]!"}</p>
              <p>{"Terima kasih sudah daftar untuk [Nama Event]."}</p>
              <p>{"Lihat invoice & tiket kamu di sini:"}</p>
              <p className="text-purple-400">{"https://wowministry.com/invoice/[order_id]"}</p>
            </div>
          </div>
        ),
      },
      {
        id: "fonnte-setup",
        title: "How to connect Fonnte",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <p>Follow these steps to get Fonnte working:</p>
            <ol className="space-y-3 list-none">
              {[
                { step: "1", title: "Create a Fonnte account", desc: "Go to md.fonnte.com and register with your email." },
                { step: "2", title: "Add a device", desc: "Click \"Add Device\" and scan the QR with the WhatsApp number that will send messages." },
                { step: "3", title: "Copy your Token", desc: "Open your device detail page. Copy the API Token shown there." },
                { step: "4", title: "Paste in Settings", desc: "Go to Admin → Settings (⚙️ top bar) → paste token into the Fonnte field → click Save Token." },
                { step: "5", title: "Test the connection", desc: "Click \"Test Connection\" to verify the token is valid and the device is online." },
              ].map((s) => (
                <li key={s.step} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                  <div>
                    <p className="font-semibold text-zinc-800 text-sm">{s.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
      {
        id: "fonnte-manual",
        title: "What if Fonnte is NOT connected?",
        content: (
          <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">check_circle</span>
              <div>
                <p className="font-semibold text-emerald-800 mb-1">Everything still works — just manually.</p>
                <p className="text-xs text-emerald-700">Fonnte is a convenience layer. The core app is fully functional without it.</p>
              </div>
            </div>
            <p>Here is the comparison for each flow:</p>
            <div className="space-y-2">
              {[
                {
                  icon: "assignment",
                  title: "Registration",
                  without: "Attendee sees their invoice link on-screen right after submitting the form.",
                  with: "Attendee also receives the invoice link automatically via WhatsApp.",
                },
                {
                  icon: "upload",
                  title: "Payment Proof Upload",
                  without: "Attendee manually uploads their transfer proof on the invoice page.",
                  with: "Same — upload is always manual by the attendee.",
                },
                {
                  icon: "check_circle",
                  title: "Payment Confirmation",
                  without: "Admin sets order to PAID in Orders page. Attendee is NOT notified — you must contact them manually.",
                  with: "Attendee automatically gets a WhatsApp message confirming their ticket is active.",
                },
                {
                  icon: "confirmation_number",
                  title: "Ticket Lookup",
                  without: "Attendee can always visit /my-ticket and search by email or phone.",
                  with: "Same — ticket lookup page is always available regardless.",
                },
              ].map((row) => (
                <div key={row.title} className="rounded-xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                    <span className="material-symbols-outlined text-base text-zinc-500">{row.icon}</span>
                    <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">{row.title}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Without Fonnte</p>
                      <p className="text-xs text-zinc-600">{row.without}</p>
                    </div>
                    <div className="p-3 bg-emerald-50/30">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">With Fonnte ✓</p>
                      <p className="text-xs text-zinc-600">{row.with}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "fonnte-messages",
        title: "What do the automated WA messages look like?",
        content: (
          <div className="space-y-5 text-zinc-600 text-sm leading-relaxed">
            <p>When Fonnte is connected, the app sends two automatic WhatsApp messages:</p>

            {/* Message 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">assignment</span>
                <p className="font-semibold text-zinc-800 text-sm">1 — After Registration (sent to PIC)</p>
              </div>
              <div className="bg-[#e9fbe9] rounded-2xl rounded-tl-sm p-4 text-sm text-zinc-800 font-sans leading-relaxed max-w-sm shadow-sm border border-emerald-100">
                <p>Halo <span className="text-primary font-medium">[Nama PIC]</span>! 👋</p>
                <br />
                <p>Pendaftaran kamu berhasil! 🎉</p>
                <br />
                <p>Silakan selesaikan pembayaran dan upload bukti transfer melalui link invoice di bawah ini:</p>
                <p className="text-blue-600 underline break-all">https://wowministry.id/invoice/<span className="text-primary">[order_id]</span></p>
                <br />
                <p>Jika ada pertanyaan, jangan ragu untuk menghubungi kami. Terima kasih! 🙏</p>
              </div>
              <p className="text-xs text-zinc-400">Sent to: pic_whatsapp (the person who submitted the registration form)</p>
            </div>

            {/* Message 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>
                <p className="font-semibold text-zinc-800 text-sm">2 — After Admin Confirms Payment (PAID)</p>
              </div>
              <div className="bg-[#e9fbe9] rounded-2xl rounded-tl-sm p-4 text-sm text-zinc-800 font-sans leading-relaxed max-w-sm shadow-sm border border-emerald-100">
                <p>Halo <span className="text-primary font-medium">[Nama PIC]</span>! 🎉</p>
                <br />
                <p>Pembayaran kamu untuk <span className="font-bold">[Nama Event]</span> sudah kami konfirmasi!</p>
                <br />
                <p>Tiket kamu sekarang sudah aktif. Kamu bisa cek tiket kamu di sini:</p>
                <p className="text-blue-600 underline">https://wowministry.id/my-ticket</p>
                <br />
                <p>Sampai jumpa di acara! 🙏</p>
              </div>
              <p className="text-xs text-zinc-400">Triggered when: Admin changes order status to PAID in the Orders page</p>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-700 mb-1">💡 Note on message content</p>
              <p>The messages above are in Indonesian (Bahasa Indonesia) by default. If you need to customize the wording, the templates live in:</p>
              <ul className="mt-1 space-y-0.5 list-disc pl-4">
                <li><code className="bg-zinc-100 px-1 rounded">src/app/[slug]/register/actions.ts</code> — registration message</li>
                <li><code className="bg-zinc-100 px-1 rounded">src/app/admin/orders/actions.ts</code> — payment confirmation message</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "fonnte-phone-url",
        title: "Phone number formats & the APP_URL setting",
        content: (
          <div className="space-y-5 text-zinc-600 text-sm leading-relaxed">
            {/* Phone normalization */}
            <div>
              <p className="font-semibold text-zinc-800 mb-2">📱 Phone number normalization</p>
              <p className="text-xs text-zinc-500 mb-3">
                The app automatically converts any phone number format to the E.164 Indonesian format (<code className="bg-zinc-100 px-1 rounded">628xxxxxxxxx</code>) before sending to Fonnte. You do not need to pre-format numbers.
              </p>
              <div className="rounded-xl border border-zinc-100 overflow-hidden">
                <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-100 px-4 py-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">What attendee types</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sent to Fonnte</p>
                </div>
                {[
                  ["08123456789", "628123456789 ✅"],
                  ["8123456789", "628123456789 ✅"],
                  ["+628123456789", "628123456789 ✅"],
                  ["628123456789", "628123456789 ✅"],
                  ["0812-3456-789", "628123456789 ✅"],
                ].map(([input, output]) => (
                  <div key={input} className="grid grid-cols-2 border-b border-zinc-100 last:border-0">
                    <div className="px-4 py-2">
                      <code className="text-xs text-zinc-600">{input}</code>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50/30">
                      <code className="text-xs text-emerald-700">{output}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* APP_URL */}
            <div>
              <p className="font-semibold text-zinc-800 mb-2">🔗 Setting the correct app URL</p>
              <p className="text-xs text-zinc-500 mb-3">
                The WA messages include a clickable link (invoice or ticket). For the link to work correctly, you must set the <code className="bg-zinc-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> environment variable to your production domain.
              </p>
              <div className="bg-zinc-900 rounded-xl p-4 text-xs font-mono space-y-2">
                <p className="text-zinc-500"># In .env.local (development)</p>
                <p className="text-emerald-400">NEXT_PUBLIC_APP_URL=http://localhost:3000</p>
                <p className="text-zinc-500 mt-2"># In Vercel / production</p>
                <p className="text-emerald-400">NEXT_PUBLIC_APP_URL=https://wowministry.id</p>
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                <span className="material-symbols-outlined text-amber-500 text-base shrink-0">warning</span>
                <p className="text-xs text-amber-700">
                  If this is not set, invoice links in WA messages will default to <code className="bg-amber-100 px-1 rounded">https://wowministry.id</code> — update it before going live.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function HelpCenterPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [activeArticle, setActiveArticle] = useState(sections[0].articles[0].id);
  const [search, setSearch] = useState("");

  const currentSection = sections.find((s) => s.id === activeSection)!;
  const currentArticle = currentSection.articles.find((a) => a.id === activeArticle)!;

  const filtered = search.trim()
    ? sections.flatMap((s) =>
        s.articles
          .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
          .map((a) => ({ sectionId: s.id, sectionTitle: s.title, article: a }))
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Help Center</h1>
        <p className="text-zinc-500 font-body">Guides and documentation for managing the WoW Ministry Dashboard.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides…"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="mb-8 bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No results found for "{search}"</div>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {filtered.map(({ sectionId, sectionTitle, article }) => (
                <li key={article.id}>
                  <button
                    onClick={() => {
                      setActiveSection(sectionId);
                      setActiveArticle(article.id);
                      setSearch("");
                    }}
                    className="w-full text-left px-6 py-4 hover:bg-purple-50/50 transition-colors"
                  >
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-0.5">{sectionTitle}</p>
                    <p className="text-sm font-semibold text-zinc-800">{article.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left: Section nav */}
        <aside className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setActiveArticle(section.articles[0].id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-semibold ${
                activeSection === section.id
                  ? "bg-white shadow-sm border border-zinc-100 text-primary"
                  : "text-zinc-500 hover:bg-white hover:text-zinc-800"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${section.color}`}>
                <span className="material-symbols-outlined text-base">{section.icon}</span>
              </div>
              {section.title}
            </button>
          ))}
        </aside>

        {/* Right: Article list + content */}
        <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
          {/* Article list */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-3">Articles</p>
            {currentSection.articles.map((article) => (
              <button
                key={article.id}
                onClick={() => setActiveArticle(article.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeArticle === article.id
                    ? "bg-primary/5 text-primary font-semibold border-l-2 border-primary pl-4"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {article.title}
              </button>
            ))}
          </div>

          {/* Article content */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] p-8">
            <h2 className="text-xl font-headline text-zinc-900 mb-6 pb-4 border-b border-zinc-100">
              {currentArticle.title}
            </h2>
            {currentArticle.content}
          </div>
        </div>
      </div>
    </div>
  );
}
