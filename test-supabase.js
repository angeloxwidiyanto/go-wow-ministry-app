const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      payment_method,
      payment_proof_url,
      status,
      created_at,
      events(id, title, slug, event_date)
    `)
    .limit(1);

  if (error) {
    console.error("Error details:", error);
  } else {
    console.log("Success, data:", data);
  }
}
run();
