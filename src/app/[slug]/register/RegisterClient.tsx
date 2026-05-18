"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { submitRegistrationAction } from "./actions";
import Link from "next/link";

type TicketTier = {
  id: string;
  name: string;
  price: number;
  min_qty: number;
  max_qty: number | null;
  description: string;
};

type Props = {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  ticketTiers: TicketTier[];
  vouchers: { code: string, discount: number, type: string }[];
};

export default function RegisterClient({ eventId, eventTitle, eventSlug, ticketTiers, vouchers }: Props) {
  useEffect(() => {
    console.log("DEBUG: Vouchers available in RegisterClient:", vouchers);
  }, [vouchers]);

  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  // PIC State
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [picWhatsapp, setPicWhatsapp] = useState("");
  const [registrationType, setRegistrationType] = useState<"personal" | "group">("personal");

  // Attendees State
  const [attendees, setAttendees] = useState<any[]>([
    { name: "", email: "", whatsapp: "", origin_church: "", ministry_role: "", gender: "", birth_date: "" }
  ]);

  // Pricing State
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string, discount: number, type: string } | null>(null);

  // Smart Checkout Logic
  const activeTier = useMemo(() => {
    if (!ticketTiers || ticketTiers.length === 0) {
      return { id: null, name: "General", price: 0 };
    }
    const count = attendees.length;
    // Sort tiers by min_qty descending to pick the highest eligible tier (e.g., group tier)
    const sortedTiers = [...ticketTiers].sort((a, b) => b.min_qty - a.min_qty);
    for (const tier of sortedTiers) {
      if (count >= tier.min_qty && (!tier.max_qty || count <= tier.max_qty)) {
        return tier;
      }
    }
    return sortedTiers[sortedTiers.length - 1]; // Fallback
  }, [ticketTiers, attendees.length]);

  const calculateTotals = () => {
    const subtotal = attendees.length * activeTier.price;
    let discountAmount = 0;

    if (appliedVoucher) {
      if (appliedVoucher.type === "PERCENT") {
        discountAmount = subtotal * (appliedVoucher.discount / 100);
      } else {
        discountAmount = appliedVoucher.discount;
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, discountAmount, total };
  };

  const totals = calculateTotals();

  const applyVoucher = () => {
    console.log("Attempting to apply voucher:", voucherInput);
    const found = vouchers.find(v => v.code.toUpperCase() === voucherInput.toUpperCase());
    console.log("Found voucher:", found);
    if (found) {
      setAppliedVoucher(found);
      setErrorMsg("");
    } else {
      setErrorMsg("Invalid voucher code.");
    }
  };

  const addAttendee = () => {
    setAttendees([...attendees, { name: "", email: "", whatsapp: "", origin_church: "", ministry_role: "", gender: "", birth_date: "" }]);  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, idx) => idx !== index));
    }
  };

  const updateAttendee = (index: number, field: string, value: string) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const copyPicToFirstAttendee = () => {
    const updated = [...attendees];
    updated[0].name = picName;
    updated[0].email = picEmail;
    updated[0].whatsapp = picWhatsapp;
    setAttendees(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (registrationType === "personal") {
        const updated = [...attendees];
        // Ensure only one attendee and copy PIC data
        updated.length = 1;
        updated[0].name = picName;
        updated[0].email = picEmail;
        updated[0].whatsapp = picWhatsapp;
        setAttendees(updated);
      }
      setStep(2);
      return;
    }

    setErrorMsg("");
    startTransition(async () => {
      // Inject the computed tier into attendees before sending
      const attendeesWithTiers = attendees.map(a => ({
        ...a,
        ticket_tier_id: activeTier.id,
        type: activeTier.name,
        price: activeTier.price
      }));

      const result = await submitRegistrationAction(
        eventId,
        eventSlug,
        eventTitle,
        { name: picName, email: picEmail, whatsapp: picWhatsapp },
        attendeesWithTiers,
        {
          totalAmount: totals.total,
          discountAmount: totals.discountAmount,
          appliedVoucher: appliedVoucher?.code || null
        }
      );

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        if (result.orderId) setOrderId(result.orderId);
        setStep(3); // Success Step
      }
    });
  };

  if (step === 3) {
    const invoiceUrl = orderId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${orderId}` : '';
    const isPaid = totals.total === 0;

    return (
      <div className="max-w-xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Top ribbon */}
          <div className={`h-2 w-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />

          <div className="p-10 text-center">
            {/* Animated icon */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <span className={`material-symbols-outlined text-5xl ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isPaid ? 'check_circle' : 'receipt_long'}
              </span>
            </div>

            <h2 className="text-3xl font-headline font-bold text-zinc-900 mb-2">
              {isPaid ? 'You\'re all set! 🎉' : 'Registration Received!'}
            </h2>
            <p className="text-zinc-500 mb-2">
              Thank you, <strong className="text-zinc-800">{picName}</strong>!
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              {attendees.length} ticket{attendees.length > 1 ? 's' : ''} for <strong className="text-zinc-800">{eventTitle}</strong> {isPaid ? 'have been confirmed.' : 'are pending payment confirmation.'}
            </p>

            {/* Payment Pending Notice */}
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
                  <p className="text-sm font-bold text-amber-800">Payment Required</p>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Your registration is saved, but your spot is <strong>not confirmed</strong> until payment is received.
                </p>
                <div className="bg-white rounded-xl p-4 border border-amber-100">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Amount Due</p>
                  <p className="text-2xl font-headline font-bold text-zinc-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totals.total)}
                  </p>
                </div>
                <p className="text-xs text-amber-600 mt-3">
                  ⚡ Please transfer payment and send your receipt to our team via WhatsApp to confirm your spot.
                </p>
              </div>
            )}

            {/* Attendee Summary */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 mb-6 text-left">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                {attendees.length} Registered Attendee{attendees.length > 1 ? 's' : ''}
              </p>
              <ul className="space-y-2">
                {attendees.map((a, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-100">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{a.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{a.origin_church || 'No church specified'}</p>
                    </div>
                    {isPaid && (
                      <span className="ml-auto shrink-0">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Invoice Link — Most Important Section */}
            {orderId && (
              <div className="mb-6">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 text-left">
                  📋 Save Your Invoice Link
                </p>
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                  <span className="material-symbols-outlined text-zinc-400 text-sm shrink-0">link</span>
                  <p className="text-xs text-zinc-600 font-mono truncate flex-1 text-left">{invoiceUrl}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invoiceUrl);
                    }}
                    className="shrink-0 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    title="Copy link"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-2 text-left">
                  ⚠️ Screenshot or save this link — it contains your e-ticket and QR codes.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {orderId && (
                <a
                  href={`/invoice/${orderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                  View Invoice / E-Ticket
                </a>
              )}
              <Link
                href={`/${eventSlug}`}
                className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-xl hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Back to Event
              </Link>
            </div>
          </div>
        </div>

        {/* Below card note */}
        <p className="text-center text-xs text-zinc-400 mt-6 px-4">
          Questions? Contact us via WhatsApp. Your registration ID is <span className="font-mono font-semibold text-zinc-600">{orderId?.split('-')[0].toUpperCase()}</span>
        </p>
      </div>
    );
  }

  // Format currency
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <Link href={`/${eventSlug}`} className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-medium mb-4 w-max">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Cancel
          </Link>
          <h1 className="text-3xl font-headline font-bold mb-1">Register for Event</h1>
          <p className="text-white/80 text-sm">{eventTitle}</p>
        </div>

        <div className="p-8">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-zinc-100'}`}></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-zinc-100'}`}></div>
          </div>

          {errorMsg && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 mb-6">
              {errorMsg}
            </div>
          )}

          {ticketTiers && ticketTiers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {ticketTiers.map(tier => {
                const isActive = activeTier?.id === tier.id;
                return (
                  <div key={tier.id} className={`p-4 rounded-xl border-2 transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-zinc-200 bg-white opacity-70'}`}>
                    <h3 className={`font-headline text-sm ${isActive ? 'text-primary font-bold' : 'text-zinc-700'}`}>{tier.name}</h3>
                    <p className="text-lg font-bold text-zinc-900 my-1">{formatIDR(tier.price)}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{tier.description || 'Valid per person'}</p>
                  </div>
                );
              })}
            </div>
          )}

          {attendees.length > 1 && activeTier && ticketTiers && ticketTiers.length > 1 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 mt-0.5">celebration</span>
              <div>
                <p className="text-emerald-800 font-semibold text-sm">Yay! {activeTier.name} aktif.</p>
                <p className="text-emerald-600 text-xs mt-1">Harga per tiket Anda menjadi {formatIDR(activeTier.price)}.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="mb-2">
                  <h2 className="text-xl font-headline font-bold text-zinc-900">Step 1: Contact Person</h2>
                  <p className="text-sm text-zinc-500">Who is booking these tickets?</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <label className={`cursor-pointer p-4 border-2 rounded-xl text-center transition-colors ${registrationType === 'personal' ? 'border-primary bg-purple-50 text-primary' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    <input type="radio" name="regType" className="hidden" checked={registrationType === 'personal'} onChange={() => setRegistrationType('personal')} />
                    <span className="material-symbols-outlined block text-3xl mb-2">person</span>
                    <span className="font-semibold block text-sm">Personal</span>
                    <span className="text-xs block mt-1">Just for myself (1 Ticket)</span>
                  </label>
                  <label className={`cursor-pointer p-4 border-2 rounded-xl text-center transition-colors ${registrationType === 'group' ? 'border-primary bg-purple-50 text-primary' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    <input type="radio" name="regType" className="hidden" checked={registrationType === 'group'} onChange={() => setRegistrationType('group')} />
                    <span className="material-symbols-outlined block text-3xl mb-2">group</span>
                    <span className="font-semibold block text-sm">Group / Bulk</span>
                    <span className="text-xs block mt-1">Registering for multiple people</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">Full Name *</label>
                  <input 
                    required 
                    value={picName}
                    onChange={e => setPicName(e.target.value)}
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                    placeholder="e.g. John Doe" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Email *</label>
                    <input 
                      required 
                      value={picEmail}
                      onChange={e => setPicEmail(e.target.value)}
                      type="email" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">WhatsApp Number *</label>
                    <input 
                      required 
                      value={picWhatsapp}
                      onChange={e => setPicWhatsapp(e.target.value)}
                      type="text" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                      placeholder="+62 812..." 
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    Next: Add Attendees
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-headline font-bold text-zinc-900">Step 2: Attendee Details</h2>
                    <p className="text-sm text-zinc-500">Provide details for all {attendees.length} ticket(s).</p>
                  </div>
                  {registrationType === "group" && (
                    <button 
                      type="button" 
                      onClick={copyPicToFirstAttendee}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Use my info for Ticket 1
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {attendees.map((attendee, idx) => (
                    <div key={idx} className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl relative group transition-all focus-within:ring-2 focus-within:ring-primary/20">
                      {registrationType === "group" && attendees.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeAttendee(idx)}
                          className="absolute top-4 right-4 w-8 h-8 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          title="Remove Attendee"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                      
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Ticket {idx + 1}</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name *</label>
                          <input 
                            required 
                            value={attendee.name}
                            onChange={(e) => updateAttendee(idx, "name", e.target.value)}
                            type="text" 
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                            placeholder="Attendee Name" 
                            disabled={registrationType === "personal"}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                            <input 
                              value={attendee.email}
                              onChange={(e) => updateAttendee(idx, "email", e.target.value)}
                              type="email" 
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                              disabled={registrationType === "personal"}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">WhatsApp</label>
                            <input 
                              value={attendee.whatsapp}
                              onChange={(e) => updateAttendee(idx, "whatsapp", e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                              disabled={registrationType === "personal"}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Gender</label>
                            <select 
                              value={attendee.gender}
                              onChange={(e) => updateAttendee(idx, "gender", e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Birth Date</label>
                            <input 
                              value={attendee.birth_date}
                              onChange={(e) => updateAttendee(idx, "birth_date", e.target.value)}
                              type="date" 
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors text-zinc-700" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Origin Church</label>
                            <input 
                              value={attendee.origin_church}
                              onChange={(e) => updateAttendee(idx, "origin_church", e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                              placeholder="e.g. WoW Main Campus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Ministry Role (Optional)</label>
                            <input 
                              value={attendee.ministry_role}
                              onChange={(e) => updateAttendee(idx, "ministry_role", e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                              placeholder="e.g. Singer, Usher"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {registrationType === "group" && (
                  <button 
                    type="button" 
                    onClick={addAttendee}
                    className="w-full py-4 border-2 border-dashed border-zinc-200 text-zinc-500 font-semibold rounded-2xl hover:border-primary hover:text-primary hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Add Another Ticket
                  </button>
                )}

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mt-8">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm text-zinc-600">
                      <span>{attendees.length}x {activeTier?.name} (Rp {formatIDR(activeTier?.price || 0)})</span>
                      <span>Rp {formatIDR(totals.subtotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 font-medium">
                        <span>Discount ({appliedVoucher?.code})</span>
                        <span>- Rp {formatIDR(totals.discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <input 
                      type="text" 
                      value={voucherInput}
                      onChange={e => setVoucherInput(e.target.value)}
                      placeholder="Promo Code" 
                      className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm uppercase outline-none focus:border-primary/50"
                      disabled={!!appliedVoucher}
                    />
                    {appliedVoucher ? (
                      <button 
                        type="button"
                        onClick={() => { setAppliedVoucher(null); setVoucherInput(""); }}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-lg text-sm hover:bg-red-100"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={applyVoucher}
                        className="px-4 py-2 bg-zinc-900 text-white font-semibold rounded-lg text-sm hover:bg-zinc-800 active:scale-95 active:opacity-80 transition-all"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                    <span className="font-bold text-zinc-900">Total Amount</span>
                    <span className="text-2xl font-headline font-bold text-primary">{formatIDR(totals.total)}</span>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="px-8 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPending ? "Processing..." : "Complete Registration"}
                    {!isPending && <span className="material-symbols-outlined">check_circle</span>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

