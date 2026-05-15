import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://txwjmllxoektebckcasq.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4d2ptbGx4b2VrdGViY2tjYXNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2ODA2NCwiZXhwIjoyMDkxNjQ0MDY0fQ.q3RvJIFmts8wFK_WzgZwOanVY-dR2TsxyGxIqC23edw";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase
    .from("registration_orders")
    .select(`
      id,
      pic_name,
      pic_email,
      pic_whatsapp,
      total_tickets,
      total_amount,
      discount_amount,
      applied_voucher,
      payment_proof_url,
      status,
      created_at,
      events(id, title, slug, event_date)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Fetched data without error.");
  }
}
run();
