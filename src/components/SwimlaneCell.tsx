"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task } from "@/lib/types";
import { cellDroppableId } from "@/lib/kanban-dnd";
import TaskCard from "./TaskCard";

type Props = {
  cellKey: string;
  tasks: Task[];
  collapsed?: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
};

export default function SwimlaneCell({
  cellKey,
  tasks,
  collapsed = false,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: cellDroppableId(cellKey) });
  const ids = tasks.map((t) => t.id);

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        className={`flex min-h-[36px] items-center rounded-md border border-black/10 bg-black/[.015] px-2 py-1.5 text-[11px] text-black/40 transition-colors dark:border-white/10 dark:bg-white/[.02] dark:text-white/40 ${
          isOver ? "bg-sky-50 dark:bg-sky-500/10" : ""
        }`}
      >
        {tasks.length > 0 ? tasks.length : "—"}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[72px] flex-col gap-2 rounded-md border border-black/10 bg-black/[.015] p-2 transition-colors dark:border-white/10 dark:bg-white/[.02] ${
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
            onDuplicate={() => onDuplicateTask(task)}
          />
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-2 text-center text-[11px] text-black/25 dark:text-white/25">
          —
        </div>
      )}
    </div>
  );
}
