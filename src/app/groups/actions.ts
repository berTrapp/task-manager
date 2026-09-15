"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { ActionResult } from "@/app/actions";
import type { Group, GroupInvite, GroupMember, GroupRole } from "@/lib/types";

type MembershipCheck =
  | { ok: true; userId: string; role: GroupRole }
  | { ok: false; error: string };

async function requireGroupMembership(groupId: string): Promise<MembershipCheck> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { ok: false, error: "Você não é membro deste grupo." };
  return { ok: true, userId: user.id, role: data.role };
}

export async function listMyGroups(): Promise<
  ActionResult<Array<Group & { role: GroupRole; memberCount: number }>>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Não autenticado." };
    const supabase = getSupabaseServerClient();

    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", user.id);
    if (membershipsError) return { ok: false, error: membershipsError.message };
    if (!memberships || memberships.length === 0) return { ok: true, data: [] };

    const groupIds = memberships.map((m) => m.group_id);
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);
    if (groupsError) return { ok: false, error: groupsError.message };

    const { data: allMembers, error: allMembersError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);
    if (allMembersError) return { ok: false, error: allMembersError.message };

    const roleByGroup = new Map(memberships.map((m) => [m.group_id, m.role]));
    const countByGroup = new Map<string, number>();
    (allMembers ?? []).forEach((m) =>
      countByGroup.set(m.group_id, (countByGroup.get(m.group_id) ?? 0) + 1)
    );

    const result = (groups ?? []).map((g) => ({
      ...g,
      role: roleByGroup.get(g.id) as GroupRole,
      memberCount: countByGroup.get(g.id) ?? 0,
    }));

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function createGroup(name: string): Promise<ActionResult<Group>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome do grupo é obrigatório." };

  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Não autenticado." };
    const supabase = getSupabaseServerClient();

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: trimmed, created_by: user.id })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "admin" });
    if (memberError) {
      await supabase.from("groups").delete().eq("id", group.id);
      return { ok: false, error: memberError.message };
    }

    revalidatePath("/");
    return { ok: true, data: group };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function getGroupForUser(
  groupId: string
): Promise<ActionResult<{ group: Group; role: GroupRole }>> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;

  try {
    const supabase = getSupabaseServerClient();
    const { data: group, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (error) return { ok: false, error: error.message };

    return { ok: true, data: { group, role: membership.role } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function listGroupMembers(groupId: string): Promise<ActionResult<GroupMember[]>> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;

  try {
    const supabase = getSupabaseServerClient();
    const { data: members, error } = await supabase
      .from("group_members")
      .select("group_id, user_id, role, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    if (!members || members.length === 0) return { ok: true, data: [] };

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);
    if (profilesError) return { ok: false, error: profilesError.message };

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const result: GroupMember[] = members.map((m) => ({
      ...m,
      profile: profileById.get(m.user_id) ?? { id: m.user_id, email: "desconhecido", full_name: null },
    }));

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function removeMember(groupId: string, userId: string): Promise<ActionResult> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;
  if (membership.role !== "admin") {
    return { ok: false, error: "Só administradores podem remover membros." };
  }
  if (userId === membership.userId) {
    return { ok: false, error: "Você não pode remover a si mesmo." };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function createInvite(groupId: string): Promise<ActionResult<GroupInvite>> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;
  if (membership.role !== "admin") {
    return { ok: false, error: "Só administradores podem criar convites." };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("group_invites")
      .insert({ group_id: groupId, created_by: membership.userId })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function listInvites(groupId: string): Promise<ActionResult<GroupInvite[]>> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;
  if (membership.role !== "admin") {
    return { ok: false, error: "Só administradores podem ver convites." };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("group_invites")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function revokeInvite(groupId: string, inviteId: string): Promise<ActionResult> {
  const membership = await requireGroupMembership(groupId);
  if (!membership.ok) return membership;
  if (membership.role !== "admin") {
    return { ok: false, error: "Só administradores podem revogar convites." };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("group_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("group_id", groupId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}
