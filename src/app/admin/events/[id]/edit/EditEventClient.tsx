"use client";

import { useState, useTransition, useRef } from "react";
import { updateEventAction } from "../../actions";
import Link from "next/link";
import ImageCropper from "@/components/ImageCropper";

const COLORS = [
  { id: "purple", label: "Purple", bg: "bg-purple-600", border: "border-purple-600" },
  { id: "blue", label: "Blue", bg: "bg-blue-600", border: "border-blue-600" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-600", border: "border-emerald-600" },
  { id: "rose", label: "Rose", bg: "bg-rose-600", border: "border-rose-600" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-500" },
  { id: "slate", label: "Dark/Slate", bg: "bg-slate-800", border: "border-slate-800" },
];

export default function EditEventClient({ event, parentEvents = [] }: { event: any, parentEvents?: { id: string, title: string }[] }) {
  const [title, setTitle] = useState(event.title || "");
  const [slug, setSlug] = useState(event.slug || "");
  const [eventType, setEventType] = useState(event.event_type || "SINGLE");
  const [parentEventId, setParentEventId] = useState(event.parent_event_id || "");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Builder States
  const [themeColor, setThemeColor] = useState(event.theme_color || "purple");
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(event.cover_image_url || "");
  const [blocks, setBlocks] = useState<{ id: number, type: string, content: string }[]>(event.content_blocks || []);

  // Pricing & Voucher States
  const [ticketTiers, setTicketTiers] = useState<{ id: any, name: string, price: number, description: string, min_qty: number, max_qty: number | null, start_date: string | null, end_date: string | null, capacity: number | null }[]>(
    event.ticket_tiers && event.ticket_tiers.length > 0 
      ? event.ticket_tiers 
      : [{ id: Date.now(), name: "Regular", price: 0, description: "", min_qty: 1, max_qty: null, start_date: null, end_date: null, capacity: null }]
  );
  const [vouchers, setVouchers] = useState<{ id: number, code: string, discount: number, type: string }[]>(
    event.vouchers ? event.vouchers.map((v: any, i: number) => ({ ...v, id: Date.now() + i })) : []
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCropSourceUrl(url);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropSourceUrl(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover_image", croppedBlob, "cover.jpg");
      
      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }
      setCoverImageUrl(data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addBlock = (type: string) => {
    setBlocks([...blocks, { id: Date.now(), type, content: "" }]);
  };

  const updateBlock = (id: number, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: number) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { id: Date.now(), name: "New Tier", price: 0, description: "", min_qty: 1, max_qty: null, start_date: null, end_date: null, capacity: null }]);
  };

  const updateTicketTier = (id: any, field: string, value: any) => {
    setTicketTiers(ticketTiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTicketTier = (id: any) => {
    setTicketTiers(ticketTiers.filter(t => t.id !== id));
  };

  const addVoucher = () => {
    setVouchers([...vouchers, { id: Date.now(), code: "", discount: 0, type: "PERCENT" }]);
  };

  const updateVoucher = (id: number, field: string, value: any) => {
    setVouchers(vouchers.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVoucher = (id: number) => {
    setVouchers(vouchers.filter(v => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updateEventAction(event.id, formData);
      if (result && !result.success) {
        setErrorMsg(result.message || "Update failed. Please try again.");
      }
    });
  };

  // Helper to format ISO strings from DB into datetime-local format in WIB (UTC+7)
  const formatWIBDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    // If it's already just a local string from input (YYYY-MM-DDThh:mm), return as is
    if (!isoString.endsWith("Z") && isoString.length <= 16) return isoString;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      d.setUTCHours(d.getUTCHours() + 7);
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const defaultDate = formatWIBDatetimeLocal(event.event_date);

  return (
    <div className="max-w-3xl pb-20">
      <header className="mb-10">
        <Link href="/admin/events" className="text-sm text-primary hover:underline flex items-center gap-1 mb-4 font-semibold w-max">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Events
        </Link>
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Edit Event</h1>
        <p className="text-zinc-500 font-body">Update the details and landing page for {event.title}.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] p-8">
          <h2 className="text-xl font-headline font-bold text-zinc-900 mb-6">1. Event Details</h2>
          
          {errorMsg && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 mb-6">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Event Type *</label>
              <select
                name="event_type"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  if (e.target.value !== "SERIES_CHILD") {
                    setParentEventId("");
                  }
                }}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors"
              >
                <option value="SINGLE">Single Event</option>
                <option value="SERIES_PARENT">Series Parent (Tour / Conference)</option>
                <option value="SERIES_CHILD">Series Child (Session / City)</option>
              </select>
            </div>

            {eventType === "SERIES_CHILD" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Parent Event *</label>
                <select
                  name="parent_event_id"
                  value={parentEventId}
                  onChange={(e) => setParentEventId(e.target.value)}
                  required={eventType === "SERIES_CHILD"}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors"
                >
                  <option value="">Select a Parent Event...</option>
                  {parentEvents.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2">This session will be grouped under the selected parent event.</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Event Title *</label>
              <input 
                required 
                name="title" 
                value={title}
                onChange={handleTitleChange}
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Landing Page URL (Slug) *</label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-xl text-zinc-500 text-sm font-medium">
                  wowministry.com/
                </span>
                <input 
                  required 
                  name="slug" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  type="text" 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-r-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Date & Time *</label>
              <input 
                required 
                name="event_date" 
                defaultValue={defaultDate}
                type="datetime-local" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Location</label>
              <input 
                name="location" 
                defaultValue={event.location || ""}
                type="text" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Virtual Meeting URL (e.g. Zoom Link)</label>
              <input 
                name="meeting_url" 
                defaultValue={event.meeting_url || ""}
                type="url" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                placeholder="https://zoom.us/j/1234567890" 
              />
              <p className="text-xs text-zinc-500 mt-2">If provided, an online check-in button will appear on attendees' E-Tickets.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Virtual Door Opens</label>
              <div className="flex items-center">
                <input 
                  name="checkin_window_minutes" 
                  type="number" 
                  defaultValue={event.checkin_window_minutes ?? 30}
                  min={0}
                  className="w-24 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-l-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                />
                <span className="px-4 py-3 bg-zinc-100 border border-l-0 border-zinc-200 rounded-r-xl text-zinc-500 text-sm font-medium">
                  minutes before the event starts
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">The "Join Virtual Event" button on the E-Ticket will be locked until this time.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Short Description</label>
              <textarea 
                name="description" 
                defaultValue={event.description || ""}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors resize-none" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                <input 
                  name="is_published" 
                  type="checkbox" 
                  className="w-5 h-5 accent-primary rounded border-zinc-300" 
                  defaultChecked={event.is_published}
                />
                <div>
                  <span className="block text-sm font-semibold text-zinc-900">Publish Event</span>
                  <span className="block text-xs text-zinc-500">If unchecked, the landing page will be hidden.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Landing Page Builder */}
        <div className="bg-white rounded-3xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">brush</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-zinc-900">2. Landing Page Builder</h2>
              <p className="text-sm text-zinc-500">Customize how your event page looks.</p>
            </div>
          </div>

          <div className="space-y-8">
            <input type="hidden" name="theme_color" value={themeColor} />
            <input type="hidden" name="content_blocks" value={JSON.stringify(blocks)} />
            <input type="hidden" name="vouchers" value={JSON.stringify(vouchers)} />
            <input type="hidden" name="ticket_tiers" value={JSON.stringify(ticketTiers)} />

            <div className="pb-6 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-zinc-700">Ticket Tiers</label>
                <button 
                  type="button" 
                  onClick={addTicketTier}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Tier
                </button>
              </div>

              <div className="space-y-4">
                {ticketTiers.map((tier) => (
                  <div key={tier.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3 relative group">
                    {ticketTiers.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTicketTier(tier.id)}
                        className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">Tier Name</label>
                        <input 
                          value={tier.name}
                          onChange={e => updateTicketTier(tier.id, 'name', e.target.value)}
                          type="text" 
                          placeholder="e.g. Regular, VIP"
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">Price (Rp)</label>
                        <input 
                          value={tier.price}
                          onChange={e => updateTicketTier(tier.id, 'price', parseFloat(e.target.value) || 0)}
                          type="number" 
                          min="0"
                          step="1000"
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1">Description (Optional)</label>
                      <input 
                        value={tier.description || ''}
                        onChange={e => updateTicketTier(tier.id, 'description', e.target.value)}
                        type="text" 
                        placeholder="e.g. Includes lunch box"
                        className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">Min Qty</label>
                        <input 
                          value={tier.min_qty}
                          onChange={e => updateTicketTier(tier.id, 'min_qty', parseInt(e.target.value) || 1)}
                          type="number" 
                          min="1"
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">Max Qty</label>
                        <input 
                          value={tier.max_qty || ''}
                          onChange={e => updateTicketTier(tier.id, 'max_qty', e.target.value ? parseInt(e.target.value) : null)}
                          type="number" 
                          min="1"
                          placeholder="No limit"
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">Start Date</label>
                        <input 
                          value={formatWIBDatetimeLocal(tier.start_date)}
                          onChange={e => updateTicketTier(tier.id, 'start_date', e.target.value || null)}
                          type="datetime-local" 
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 mb-1">End Date</label>
                        <input 
                          value={formatWIBDatetimeLocal(tier.end_date)}
                          onChange={e => updateTicketTier(tier.id, 'end_date', e.target.value || null)}
                          type="datetime-local" 
                          className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-6 border-b border-zinc-100">

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-zinc-700">Discount Vouchers</label>
                  <button 
                    type="button" 
                    onClick={addVoucher}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Voucher
                  </button>
                </div>
                
                <div className="space-y-3">
                  {vouchers.map((voucher) => (
                    <div key={voucher.id} className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                      <input 
                        value={voucher.code}
                        onChange={e => updateVoucher(voucher.id, 'code', e.target.value.toUpperCase())}
                        type="text" 
                        placeholder="CODE"
                        className="w-1/3 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded focus:outline-none uppercase"
                      />
                      <input 
                        value={voucher.discount}
                        onChange={e => updateVoucher(voucher.id, 'discount', parseFloat(e.target.value))}
                        type="number" 
                        min="0"
                        className="w-1/4 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded focus:outline-none"
                      />
                      <select 
                        value={voucher.type}
                        onChange={e => updateVoucher(voucher.id, 'type', e.target.value)}
                        className="w-1/4 px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded focus:outline-none"
                      >
                        <option value="PERCENT">%</option>
                        <option value="FIXED">Flat (Rp)</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeVoucher(voucher.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                  {vouchers.length === 0 && (
                    <p className="text-xs text-zinc-500 italic p-3 text-center border border-dashed border-zinc-200 rounded-lg">
                      No vouchers active.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-3">Color Theme</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setThemeColor(color.id)}
                    className={`w-12 h-12 rounded-full border-2 transition-all shadow-sm flex items-center justify-center ${color.bg} ${themeColor === color.id ? `ring-2 ring-offset-2 ring-${color.id}-500 ${color.border}` : 'border-transparent hover:scale-110'}`}
                    title={color.label}
                  >
                    {themeColor === color.id && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Cover Image URL (Optional)</label>
              <input type="hidden" name="cover_image_url" value={coverImageUrl} />

              <div className="flex flex-col md:flex-row gap-4 items-start">
                {coverImageUrl ? (
                  <div className="relative group shrink-0">
                    <div className="rounded-xl overflow-hidden w-full md:w-64 h-36 border border-zinc-200">
                      <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCoverImageUrl("")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full md:w-64 h-36 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 ${isUploading ? 'bg-zinc-50' : 'hover:bg-zinc-50 hover:border-primary/50'}`}
                  >
                    {isUploading ? (
                      <>
                        <span className="material-symbols-outlined text-primary text-2xl animate-spin mb-2">progress_activity</span>
                        <p className="text-xs text-zinc-500 font-semibold">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-zinc-400 text-3xl mb-2">add_photo_alternate</span>
                        <p className="text-xs text-zinc-500 font-semibold">Click to upload image</p>
                        <p className="text-[10px] text-zinc-400 mt-1">16:9 ratio recommended</p>
                      </>
                    )}
                  </div>
                )}

                <div className="flex-1 w-full">
                  <p className="text-xs text-zinc-500 mb-2">Or paste an external image URL directly:</p>
                  <input 
                    value={coverImageUrl}
                    onChange={e => setCoverImageUrl(e.target.value)}
                    type="url" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-colors" 
                    placeholder="https://example.com/image.jpg" 
                  />
                </div>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-semibold text-zinc-700 mb-4">Additional Content Blocks</label>
              
              <div className="space-y-4 mb-6">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 relative group">
                    <button 
                      type="button" 
                      onClick={() => removeBlock(block.id)}
                      className="absolute top-2 right-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    
                    <div className="mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-zinc-400 text-sm">
                        {block.type === 'text' ? 'notes' : 'format_quote'}
                      </span>
                      <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                        {block.type === 'text' ? 'Rich Text Block' : 'Important Quote Block'}
                      </span>
                    </div>

                    <textarea 
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      rows={block.type === 'text' ? 4 : 2}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    />
                  </div>
                ))}
                
                {blocks.length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500">
                    <p className="text-sm">No additional blocks added.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => addBlock('text')}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">notes</span>
                  Add Text Block
                </button>
                <button 
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">format_quote</span>
                  Add Quote Block
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end sticky bottom-6 z-10">
          <button 
            type="submit" 
            disabled={isPending}
            className="px-8 py-4 bg-zinc-900 text-white text-sm font-semibold rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-lg">
              {isPending ? "hourglass_empty" : "check_circle"}
            </span>
            {isPending ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>

      {cropSourceUrl && (
        <ImageCropper
          imageUrl={cropSourceUrl}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropSourceUrl(null)}
        />
      )}
    </div>
  );
}
