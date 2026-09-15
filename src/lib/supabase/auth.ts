import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function assertAuthConfigured() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase Auth não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local."
    );
  }
}

/**
 * Cookie-backed Supabase client scoped to the current request's session.
 * Use for auth (sign in/out, reading the current user) — never for data
 * access, since RLS on `tasks` has no public policies. Create a fresh
 * instance per request; never share across requests.
 */
export async function getSupabaseAuthServerClient() {
  assertAuthConfigured();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called during a Server Component render, where cookies can't
            // be written. Safe to ignore — proxy.ts refreshes the session
            // cookie on navigation instead.
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = await getSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
