"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { cellDroppableId } from "@/lib/kanban-dnd";
import TaskCard from "./TaskCard";

type Props = {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
};

const COLUMN_ACCENTS: Record<TaskStatus, string> = {
  aberto: "border-t-sky-500",
  desenvolvimento: "border-t-amber-500",
  concluido: "border-t-emerald-500",
};

export default function Column({ status, tasks, onEditTask, onDeleteTask, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: cellDroppableId(status) });
  const ids = tasks.map((t) => t.id);

  return (
    <div className="flex w-full min-w-0 flex-col sm:w-80 sm:shrink-0">
      <div
        className={`flex items-center justify-between border-t-4 ${COLUMN_ACCENTS[status]} rounded-t-lg bg-black/[.03] px-3 py-2 dark:bg-white/[.05]`}
      >
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-black/10 bg-black/[.015] p-2 transition-colors dark:border-white/10 dark:bg-white/[.02] ${
          isOver ? "bg-sky-50 dark:bg-sky-500/10" : ""
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="flex flex-1 items-center justify-center py-6 text-center text-xs text-black/35 dark:text-white/35">
            Nenhuma demanda aqui.
            <br />
            Arraste um cartão ou adicione uma nova.
          </p>
        )}

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="mt-1 rounded-md border border-dashed border-black/15 px-3 py-2 text-xs font-medium text-black/50 hover:border-black/30 hover:text-black/70 dark:border-white/15 dark:text-white/50 dark:hover:border-white/30 dark:hover:text-white/70"
        >
          + Nova demanda
        </button>
      </div>
    </div>
  );
}
