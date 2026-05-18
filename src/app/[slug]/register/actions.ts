"use server";

import { getFonnteToken, sendWhatsApp } from "@/utils/fonnte";
import { apiFetch } from "@/utils/api";

// ─── Main Registration Action ─────────────────────────────────────────────────
export async function submitRegistrationAction(
  eventId: string,
  eventSlug: string,
  eventTitle: string,
  picData: { name: string; email: string; whatsapp: string },
  attendees: any[],
  pricingData: { totalAmount: number; discountAmount: number; appliedVoucher: string | null; paymentMethod?: string | null }
) {
  // Use Go API for registration (it handles CRM soft-matching and DB inserts)
  const orderPayload = {
    event_id: eventId,
    event_slug: eventSlug,
    pic_name: picData.name,
    pic_email: picData.email,
    pic_whatsapp: picData.whatsapp,
    total_tickets: attendees.length,
    total_amount: pricingData.totalAmount,
    discount_amount: pricingData.discountAmount,
    applied_voucher: pricingData.appliedVoucher,
    payment_method: pricingData.paymentMethod || null,
    status: pricingData.totalAmount > 0 ? "PENDING" : "PAID",
  };

  try {
    const res = await apiFetch<{ order_id: string }>("/api/events/register", {
      method: "POST",
      body: JSON.stringify({
        order: orderPayload,
        attendees: attendees
      }),
    });

    if (!res || !res.order_id) {
      return { error: "Registration failed. Please try again or contact us." };
    }

    const orderId = res.order_id;

    // ── Step 3: Send WhatsApp notification (if Fonnte is configured) ─────────
    // This runs AFTER the registration is committed. A failure here does NOT
    // block or roll back the registration — it fails silently.
    try {
      const fonnteToken = await getFonnteToken();
      if (fonnteToken && picData.whatsapp) {
        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://wowministry.id"}/invoice/${orderId}`;
        
        let attendeesStr = "";
        attendees.forEach((a, idx) => {
          const priceFormatted = new Intl.NumberFormat("id-ID").format(a.price || 0);
          attendeesStr += `${idx + 1}. ${a.name} – ${a.type} (Rp ${priceFormatted})\n`;
        });
        const totalFormatted = new Intl.NumberFormat("id-ID").format(pricingData.totalAmount || 0);

        const message =
          `Halo ${picData.name}! 👋\n\n` +
          `Pendaftaran kamu untuk *${eventTitle}* berhasil! 🎉\n\n` +
          `📋 *Detail Peserta:*\n${attendeesStr}\n` +
          `💰 *Total Tagihan:* Rp ${totalFormatted}\n\n` +
          `Silakan selesaikan pembayaran melalui link invoice:\n` +
          `${invoiceUrl}\n\n` +
          `Jika ada pertanyaan, jangan ragu hubungi kami. Terima kasih! 🙏`;

        await sendWhatsApp(fonnteToken, picData.whatsapp, message);
      }
    } catch {
      // Never block registration due to notification failure
    }

    return { success: true, orderId };

  } catch (error: any) {
    console.error("Registration API failed:", error);
    const msg = error?.message || "";
    if (msg.includes("sold out")) return { error: `Sorry, one of the ticket tiers is sold out.` };
    if (msg.includes("Voucher usage limit")) return { error: "This voucher has reached its usage limit." };
    if (msg.includes("Voucher is expired")) return { error: "This voucher has expired." };
    if (msg.includes("Voucher is not yet active")) return { error: "This voucher is not active yet." };
    if (msg.includes("Voucher not found")) return { error: "Invalid voucher code." };

    return { error: "Registration failed. Please try again or contact us." };
  }
}
