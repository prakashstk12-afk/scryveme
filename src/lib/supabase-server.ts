import { createClient } from '@supabase/supabase-js';

const url         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client — bypasses RLS, server-side only, NEVER expose to client
export function getSupabaseAdmin() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
