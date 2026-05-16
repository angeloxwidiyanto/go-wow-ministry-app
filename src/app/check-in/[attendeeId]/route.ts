import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  const { attendeeId } = await params;
  const supabase = createAdminClient();

  // 1. Fetch attendee, order, and event
  const { data: attendee, error: attendeeErr } = await supabase
    .from("event_attendees")
    .select(`
      id,
      order_id,
      attended_at,
      registration_orders (
        id,
        status,
        event_id,
        events (
          id,
          title,
          event_date,
          meeting_url
        )
      )
    `)
    .eq("id", attendeeId)
    .single();

  if (attendeeErr || !attendee || !attendee.registration_orders) {
    return new NextResponse("Attendee or Order not found.", { status: 404 });
  }

  const order = attendee.registration_orders as any;
  const event = order.events;

  // 2. Validate Order Status
  if (order.status !== "PAID") {
    return new NextResponse("Cannot check in: Order is not PAID.", { status: 403 });
  }

  // 3. Validate Meeting URL exists
  if (!event.meeting_url) {
    return new NextResponse("This event does not have a virtual meeting URL.", { status: 400 });
  }

  // 4. Validate Time (Gated Check-in: 30 mins before)
  const eventDate = new Date(event.event_date);
  const now = new Date();
  const diffInMinutes = (eventDate.getTime() - now.getTime()) / (1000 * 60);

  if (diffInMinutes > 30) {
    // If they click > 30 mins before the event, reject or redirect to a waiting page
    // Here we can just redirect them to their invoice page with a URL parameter ?error=too_early
    const invoiceUrl = new URL(`/invoice/${order.id}?error=too_early`, request.url);
    return NextResponse.redirect(invoiceUrl);
  }

  // 5. Mark as attended if not already
  if (!attendee.attended_at) {
    const { error: updateErr } = await supabase
      .from("event_attendees")
      .update({ attended_at: new Date().toISOString() })
      .eq("id", attendeeId);

    if (updateErr) {
      console.error("Failed to update attended_at:", updateErr);
      return new NextResponse("Failed to process check-in.", { status: 500 });
    }
  }

  // 6. Redirect to Zoom / Meeting URL
  return NextResponse.redirect(event.meeting_url);
}
