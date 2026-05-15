import { apiFetch } from "@/utils/api";
import { notFound } from "next/navigation";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col pt-10 px-4 pb-20">
      <RegisterClient 
        eventId={event.id}
        eventTitle={event.title}
        eventSlug={event.slug}
        ticketTiers={event.ticket_tiers || []}
        vouchers={(event.event_vouchers || []).map((v: any) => ({
          code: v.code,
          discount: v.discount_amount,
          type: v.discount_type
        }))}
      />
    </div>
  );
}
