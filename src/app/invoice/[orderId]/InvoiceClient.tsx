"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";

type Order = {
  id: string;
  created_at: string;
  pic_name: string;
  pic_email: string;
  pic_whatsapp: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  total_tickets: number;
  total_amount: number;
  discount_amount: number;
  applied_voucher: string | null;
  events: {
    title: string;
    description: string | null;
    location: string;
    event_date: string;
    ticket_price: number;
    theme_color: string;
    meeting_url: string | null;
  };
  event_attendees: {
    id: string;
    attendee_name: string;
    registration_number: string;
    registration_type: string;
    origin_church: string | null;
  }[];
};

export default function InvoiceClient({ order }: { order: Order }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.status === "PAID";
  const isCancelled = order.status === "CANCELLED";
  const isPending = order.status === "PENDING";
  const subtotal = Number(order.total_amount) + Number(order.discount_amount);
  const ticketPrice = order.total_tickets > 0 ? subtotal / order.total_tickets : 0;

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: A4; 
            margin: 10mm; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-scale {
            width: 100%;
            margin: 0 auto;
            /* Zoom works well on WebKit to scale without leaving empty bounding box space */
            zoom: 0.85; 
          }
          .print-p-adjust {
            padding: 20px !important;
          }
          .print-m-adjust {
            margin-bottom: 12px !important;
          }
          .print-gap-adjust {
            gap: 12px !important;
          }
        }
      `}} />
      <div className="w-full max-w-3xl print-scale flex flex-col items-center mx-auto">
        {/* Action Bar (Hidden when printing) */}
        <div className="flex justify-between items-center mb-6 w-full print:hidden">
        <Link href="/" className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-semibold text-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">home</span>
          Back Home
        </Link>
        <button 
          onClick={handlePrint}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-colors shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Download PDF / Print
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none w-full max-w-3xl">
        
        {/* Header Ribbon */}
        <div className={`h-4 ${isPaid ? 'bg-emerald-500' : isCancelled ? 'bg-red-500' : 'bg-amber-500'}`}></div>

        <div className="p-10 md:p-14 print-p-adjust">
          
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 print-m-adjust">
            <div>
              <div className="flex items-center mb-6 print-m-adjust">
                <div className="flex items-center justify-center shrink-0">
                   <img src="/logo.png" alt="WoW Logo" className="w-40 md:w-48 h-auto object-contain" />
                </div>
              </div>
              <p className="text-zinc-500 text-sm">Official Registration Invoice</p>
              <h1 className="text-3xl font-headline font-bold text-zinc-900 mt-2">{isPaid ? 'Receipt / E-Tickets' : 'Invoice'}</h1>
              <p className="text-zinc-500 text-sm mt-1">Order #{order.id.split("-")[0].toUpperCase()}</p>
            </div>

            <div className="text-left md:text-right">
              {isPaid && (
                <div className="inline-block border-4 border-emerald-500 text-emerald-500 px-6 py-2 rounded-lg transform rotate-[-5deg] font-bold tracking-widest text-xl mb-4 print:border-emerald-500 print:text-emerald-500 print-m-adjust">
                  PAID IN FULL
                </div>
              )}
              {isPending && (
                <div className="inline-block border-4 border-amber-500 text-amber-500 px-6 py-2 rounded-lg font-bold tracking-widest text-xl mb-4 print-m-adjust">
                  PAYMENT PENDING
                </div>
              )}
              {isCancelled && (
                <div className="inline-block border-4 border-red-500 text-red-500 px-6 py-2 rounded-lg font-bold tracking-widest text-xl mb-4 print-m-adjust">
                  CANCELLED
                </div>
              )}
              <p className="text-zinc-700 font-semibold text-sm">Date Issued</p>
              <p className="text-zinc-500 text-sm mb-4 print-m-adjust">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 print-m-adjust print-gap-adjust">
            {/* Bill To */}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Billed To / PIC</p>
              <p className="text-lg font-semibold text-zinc-900">{order.pic_name}</p>
              <p className="text-zinc-600 text-sm mt-1">{order.pic_email}</p>
              <p className="text-zinc-600 text-sm">{order.pic_whatsapp}</p>
            </div>

            {/* Event Info */}
            <div className="md:text-right">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Event Details</p>
              <p className="text-lg font-semibold text-zinc-900">{order.events.title}</p>
              <p className="text-zinc-600 text-sm mt-1">
                {new Date(order.events.event_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
              </p>
              <p className="text-zinc-600 text-sm">{order.events.location || "Location TBD"}</p>
            </div>
          </div>

          {order.events.description && (
            <div className="mb-12 p-4 bg-zinc-50 border border-zinc-200 rounded-xl print-m-adjust flex gap-3 text-left">
              <span className="material-symbols-outlined text-zinc-400 shrink-0">info</span>
              <div>
                <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Important Note from Organizer</p>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{order.events.description}</p>
              </div>
            </div>
          )}

          {/* Tickets / Items Table */}
          <div className="mb-12 print-m-adjust">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-200 pb-2">Tickets / Attendees</h3>
            <div className="space-y-4">
              {order.event_attendees.map((attendee, idx) => (
                <div key={attendee.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl print:bg-transparent print:border-zinc-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center shrink-0 text-zinc-500 font-mono text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{attendee.attendee_name}</p>
                      <p className="text-xs text-zinc-500">{attendee.origin_church || "No church specified"}</p>
                      {isPaid && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-white px-2 py-1 rounded border border-zinc-200">
                          <span className="material-symbols-outlined text-[14px] text-zinc-400">qr_code_2</span>
                          <span className="text-xs font-mono text-zinc-700 tracking-widest">{attendee.registration_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right sm:text-right flex flex-col items-end gap-3">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">{attendee.registration_type} Ticket</p>
                      <p className="font-semibold text-zinc-900">Rp {ticketPrice ? ticketPrice.toLocaleString() : "0"}</p>
                    </div>
                    {isPaid && (
                      <div className="mt-2 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm print:shadow-none print:border-none">
                        {order.events.meeting_url ? (
                          <a
                            href={`/api/check-in/${attendee.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">videocam</span>
                            Join Virtual Event
                          </a>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <QRCode
                              value={attendee.id}
                              size={80}
                              level="L"
                              className="rounded-lg"
                            />
                            <span className="text-[10px] text-zinc-400 font-mono tracking-widest">Scan to Check-In</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t border-zinc-200 pt-6 flex flex-col items-end">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between text-zinc-600 text-sm">
                <span>Subtotal ({order.total_tickets} tickets)</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>
              
              {(order.discount_amount > 0 || order.applied_voucher) && (
                <div className="flex justify-between text-emerald-600 text-sm font-medium">
                  <span>Voucher Discount {order.applied_voucher ? `(${order.applied_voucher})` : ""}</span>
                  <span>- Rp {order.discount_amount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t border-zinc-200 pt-4 mt-2">
                <span className="font-bold text-zinc-900 text-lg">{isPaid ? 'Total Paid' : 'Total Amount Due'}</span>
                <span className="text-3xl font-headline font-bold text-zinc-900">Rp {order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-16 print:mt-8 pt-8 border-t border-zinc-100 text-center text-zinc-400 text-xs">
            <p>If you have any questions concerning this invoice, please contact support@wowministry.com.</p>
            <p className="mt-1">Thank you for joining our community!</p>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
