"use server";

import { getSupabaseAuthServerClient } from "@/lib/supabase/auth";
import type { ActionResult } from "@/app/actions";

export async function signIn(email: string, password: string): Promise<ActionResult> {
  if (!email.trim() || !password) {
    return { ok: false, error: "Informe e-mail e senha." };
  }

  try {
    const supabase = await getSupabaseAuthServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return { ok: false, error: "E-mail ou senha inválidos." };
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro inesperado ao entrar",
    };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseAuthServerClient();
  await supabase.auth.signOut();
}
