import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://txwjmllxoektebckcasq.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4d2ptbGx4b2VrdGViY2tjYXNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2ODA2NCwiZXhwIjoyMDkxNjQ0MDY0fQ.q3RvJIFmts8wFK_WzgZwOanVY-dR2TsxyGxIqC23edw";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data, error } = await supabase
    .from("registration_orders")
    .select(`*`)
    .limit(1);

  if (error) {
    console.error("Error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success, data columns:", Object.keys(data[0] || {}));
  }
}
run();
