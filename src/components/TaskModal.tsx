"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createTask, updateTask } from "@/app/actions";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  TASK_URGENCIES,
  URGENCY_LABELS,
  displayName,
  type GroupMember,
  type Task,
  type TaskStatus,
  type TaskUrgency,
} from "@/lib/types";

type Props = {
  groupId: string;
  members: GroupMember[];
  tasks: Task[];
  mode: "create" | "edit";
  task?: Task;
  initialStatus?: TaskStatus;
  initialAssigneeId?: string | null;
  onClose: () => void;
  onSaved: (task: Task, mode: "create" | "edit") => void;
};

export default function TaskModal({
  groupId,
  members,
  tasks,
  mode,
  task,
  initialStatus,
  initialAssigneeId,
  onClose,
  onSaved,
}: Props) {
  const [description, setDescription] = useState(task?.description ?? "");
  const [requester, setRequester] = useState(task?.requester ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(
    task?.assignee_id ?? initialAssigneeId ?? ""
  );
  const [urgency, setUrgency] = useState<TaskUrgency>(task?.urgency ?? "media");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus ?? "aberto");
  const [observations, setObservations] = useState(task?.observations ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const requesterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      const key = t.requester.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, t.requester.trim());
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tasks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim() || !requester.trim()) {
      setError("Descrição e solicitante são obrigatórios.");
      return;
    }

    setPending(true);
    const input = {
      description: description.trim(),
      requester: requester.trim(),
      assignee_id: assigneeId || null,
      urgency,
      observations: observations.trim() || null,
      status,
    };

    const result =
      mode === "create"
        ? await createTask(groupId, input)
        : await updateTask(groupId, task!.id, input);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data, mode);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900">
        <h2 className="text-base font-semibold">
          {mode === "create" ? "Nova demanda" : "Editar demanda"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Descrição">
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className={inputClass}
              placeholder="O que precisa ser feito?"
            />
          </Field>

          <Field label="Solicitante">
            <input
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              required
              list="requester-options"
              className={inputClass}
              placeholder="Quem pediu essa demanda?"
            />
            <datalist id="requester-options">
              {requesterOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>

          <Field label="Responsável">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {displayName(m.profile)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Urgência">
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as TaskUrgency)}
                className={inputClass}
              >
                {TASK_URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {URGENCY_LABELS[u]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClass}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Observações (opcional)">
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Detalhes adicionais"
            />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}
