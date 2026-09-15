"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { TASK_STATUSES, TASK_URGENCIES, type Task } from "@/lib/types";

const taskInputSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória").max(2000),
  requester: z.string().trim().min(1, "Solicitante é obrigatório").max(200),
  assignee_id: z.string().uuid().nullable(),
  urgency: z.enum(TASK_URGENCIES),
  observations: z
    .string()
    .trim()
    .max(4000)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(TASK_STATUSES),
});

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireMembership(groupId: string): Promise<ActionResult<{ userId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { ok: false, error: "Você não é membro deste grupo." };
  return { ok: true, data: { userId: user.id } };
}

async function runGroupAction<T>(
  groupId: string,
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    const membership = await requireMembership(groupId);
    if (!membership.ok) return membership;
    return await fn();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro inesperado ao acessar o banco de dados",
    };
  }
}

export async function getTasks(groupId: string): Promise<Task[]> {
  const membership = await requireMembership(groupId);
  if (!membership.ok) throw new Error(membership.error);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("group_id", groupId)
    .order("status", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function createTask(
  groupId: string,
  input: z.infer<typeof taskInputSchema>
): Promise<ActionResult<Task>> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  return runGroupAction(groupId, async () => {
    const supabase = getSupabaseServerClient();

    let countQuery = supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", parsed.data.status);
    countQuery = parsed.data.assignee_id
      ? countQuery.eq("assignee_id", parsed.data.assignee_id)
      : countQuery.is("assignee_id", null);
    const { count } = await countQuery;

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...parsed.data, group_id: groupId, position: count ?? 0 })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: data as Task };
  });
}

export async function updateTask(
  groupId: string,
  id: string,
  input: z.infer<typeof taskInputSchema>
): Promise<ActionResult<Task>> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  return runGroupAction(groupId, async () => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(parsed.data)
      .eq("id", id)
      .eq("group_id", groupId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: data as Task };
  });
}

export async function deleteTask(groupId: string, id: string): Promise<ActionResult> {
  return runGroupAction(groupId, async () => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id).eq("group_id", groupId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: undefined };
  });
}

const reorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    status: z.enum(TASK_STATUSES),
    assignee_id: z.string().uuid().nullable(),
    position: z.number().int().min(0),
  })
);

export async function reorderTasks(
  groupId: string,
  updates: z.infer<typeof reorderSchema>
): Promise<ActionResult> {
  const parsed = reorderSchema.safeParse(updates);
  if (!parsed.success) {
    return { ok: false, error: "Dados de reordenação inválidos" };
  }
  if (parsed.data.length === 0) return { ok: true, data: undefined };

  return runGroupAction(groupId, async () => {
    const supabase = getSupabaseServerClient();
    const results = await Promise.all(
      parsed.data.map((u) =>
        supabase
          .from("tasks")
          .update({ status: u.status, assignee_id: u.assignee_id, position: u.position })
          .eq("id", u.id)
          .eq("group_id", groupId)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

    revalidatePath(`/groups/${groupId}`);
    return { ok: true, data: undefined };
  });
}
