"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { TASK_STATUSES, TASK_URGENCIES, type Task } from "@/lib/types";

const taskInputSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória").max(2000),
  requester: z.string().trim().min(1, "Solicitante é obrigatório").max(200),
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

async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Não autenticado." };
    return await fn();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro inesperado ao acessar o banco de dados",
    };
  }
}

export async function getTasks(): Promise<Task[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("status", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function createTask(
  input: z.infer<typeof taskInputSchema>
): Promise<ActionResult<Task>> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  return runAction(async () => {
    const supabase = getSupabaseServerClient();

    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", parsed.data.status);

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...parsed.data, position: count ?? 0 })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: data as Task };
  });
}

export async function updateTask(
  id: string,
  input: z.infer<typeof taskInputSchema>
): Promise<ActionResult<Task>> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  return runAction(async () => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(parsed.data)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: data as Task };
  });
}

export async function deleteTask(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  });
}

const reorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    status: z.enum(TASK_STATUSES),
    position: z.number().int().min(0),
  })
);

export async function reorderTasks(
  updates: z.infer<typeof reorderSchema>
): Promise<ActionResult> {
  const parsed = reorderSchema.safeParse(updates);
  if (!parsed.success) {
    return { ok: false, error: "Dados de reordenação inválidos" };
  }
  if (parsed.data.length === 0) return { ok: true, data: undefined };

  return runAction(async () => {
    const supabase = getSupabaseServerClient();
    const results = await Promise.all(
      parsed.data.map((u) =>
        supabase
          .from("tasks")
          .update({ status: u.status, position: u.position })
          .eq("id", u.id)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  });
}
