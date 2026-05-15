import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the Service Role key.
 * This bypasses Row Level Security (RLS) — ONLY use in server-side admin contexts.
 * Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to your .env.local from Supabase Dashboard → Project Settings → API."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
