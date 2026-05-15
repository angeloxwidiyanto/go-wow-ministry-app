import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://txwjmllxoektebckcasq.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4d2ptbGx4b2VrdGViY2tjYXNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2ODA2NCwiZXhwIjoyMDkxNjQ0MDY0fQ.q3RvJIFmts8wFK_WzgZwOanVY-dR2TsxyGxIqC23edw";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: event } = await supabase.from('events').select('id, ticket_tiers(id, name)').limit(1).single();
  if (!event) return console.log("No event found");

  const orderPayload = {
    event_id: event.id,
    pic_name: "Test",
    pic_email: "test@test.com",
    pic_whatsapp: "123",
    total_tickets: 1,
    total_amount: 0,
    discount_amount: 0,
    applied_voucher: null,
    status: "PENDING",
  };

  const resolvedAttendees = [{
    person_id: null,
    ticket_tier_id: event.ticket_tiers?.[0]?.id || null,
    registration_number: "TEST-1",
    registration_type: "GENERAL",
    attendee_name: "Test",
    attendee_email: "test@test.com",
    attendee_whatsapp: "123",
  }];

  const { data, error } = await supabase.rpc("register_for_event", {
    p_order_payload: orderPayload,
    p_attendees_payload: resolvedAttendees,
  });

  console.log("Result:", data);
  if (error) console.error("Error:", error);
}
run();
