import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Server-only client using the service role key, so it bypasses RLS.
 * Never import this from a "use client" file.
 */
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local (veja .env.local.example)."
    );
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }

  return cachedClient;
}
