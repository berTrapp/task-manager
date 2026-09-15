import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser-only client using the publishable/anon key plus the signed-in
 * user's session (synced from cookies). Only ever used to read — subject
 * to RLS, which only grants SELECT (see supabase/schema.sql). Never used
 * to write; all mutations go through Server Actions with the service role.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(url, anonKey);
  }
  return cachedClient;
}
