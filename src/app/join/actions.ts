"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAuthServerClient, getCurrentUser } from "@/lib/supabase/auth";
import type { ActionResult } from "@/app/actions";
import type { Group, GroupInvite } from "@/lib/types";

async function validateInvite(
  token: string
): Promise<{ ok: true; invite: GroupInvite; group: Group } | { ok: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data: invite, error } = await supabase
    .from("group_invites")
    .select("*")
    .eq("id", token)
    .maybeSingle();

  if (error || !invite) return { ok: false, error: "Convite inválido." };
  if (invite.revoked_at) return { ok: false, error: "Este convite foi revogado." };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Este convite expirou." };
  }
  if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
    return { ok: false, error: "Este convite já atingiu o limite de usos." };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", invite.group_id)
    .single();
  if (groupError || !group) return { ok: false, error: "Grupo não encontrado." };

  return { ok: true, invite, group };
}

async function addMemberAndBumpInvite(
  groupId: string,
  userId: string,
  inviteId: string,
  currentUses: number
) {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("group_members")
    .upsert(
      { group_id: groupId, user_id: userId, role: "member" },
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );
  await supabase.from("group_invites").update({ uses_count: currentUses + 1 }).eq("id", inviteId);
}

export async function getInvitePreview(
  token: string
): Promise<ActionResult<{ groupName: string; alreadyMember: boolean }>> {
  const validation = await validateInvite(token);
  if (!validation.ok) return { ok: false, error: validation.error };

  const user = await getCurrentUser();
  let alreadyMember = false;
  if (user) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", validation.group.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyMember = Boolean(data);
  }

  return { ok: true, data: { groupName: validation.group.name, alreadyMember } };
}

export async function acceptInviteAsCurrentUser(
  token: string
): Promise<ActionResult<{ groupId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Não autenticado." };

    const validation = await validateInvite(token);
    if (!validation.ok) return { ok: false, error: validation.error };

    await addMemberAndBumpInvite(
      validation.group.id,
      user.id,
      validation.invite.id,
      validation.invite.uses_count
    );

    return { ok: true, data: { groupId: validation.group.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function acceptInviteNewAccount(
  token: string,
  email: string,
  password: string,
  fullName: string
): Promise<ActionResult<{ groupId: string }>> {
  if (!email.trim() || !password) {
    return { ok: false, error: "Informe e-mail e senha." };
  }
  if (password.length < 6) {
    return { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  try {
    const validation = await validateInvite(token);
    if (!validation.ok) return { ok: false, error: validation.error };

    const supabase = getSupabaseServerClient();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: fullName.trim() ? { full_name: fullName.trim() } : undefined,
    });

    if (createError || !created.user) {
      const message = createError?.message ?? "";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registrad")) {
        return {
          ok: false,
          error:
            "Já existe uma conta com esse e-mail. Faça login e peça para um administrador do grupo te adicionar.",
        };
      }
      return { ok: false, error: message || "Não foi possível criar a conta." };
    }

    await addMemberAndBumpInvite(
      validation.group.id,
      created.user.id,
      validation.invite.id,
      validation.invite.uses_count
    );

    const authClient = await getSupabaseAuthServerClient();
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      return {
        ok: false,
        error: "Conta criada, mas não foi possível entrar automaticamente. Faça login normalmente.",
      };
    }

    return { ok: true, data: { groupId: validation.group.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}
