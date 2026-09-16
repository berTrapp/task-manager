"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { URGENCY_LABELS } from "@/lib/types";
import { URGENCY_STYLES, formatDate } from "@/lib/ui";

type Props = {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  dragging?: boolean;
};

export default function TaskCard({ task, onEdit, onDelete, onDuplicate, dragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-lg border border-black/10 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/[.04] ${
        isDragging ? "opacity-40" : ""
      } ${dragging ? "rotate-2 shadow-lg" : ""} cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${URGENCY_STYLES[task.urgency]}`}
        >
          {URGENCY_LABELS[task.urgency]}
        </span>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onPointerDown={stopDrag}
            onClick={onEdit}
            className="rounded p-1 text-black/50 hover:bg-black/5 hover:text-black/80 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80"
            aria-label="Editar demanda"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onPointerDown={stopDrag}
            onClick={onDuplicate}
            className="rounded p-1 text-black/50 hover:bg-black/5 hover:text-black/80 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80"
            aria-label="Duplicar demanda"
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            onPointerDown={stopDrag}
            onClick={onDelete}
            className="rounded p-1 text-black/50 hover:bg-red-50 hover:text-red-600 dark:text-white/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            aria-label="Excluir demanda"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <p className="mt-2 line-clamp-3 text-sm font-medium text-black/90 dark:text-white/90">
        {task.description}
      </p>

      <p className="mt-1 text-xs text-black/60 dark:text-white/60 truncate">
        Solicitante: <span className="font-medium">{task.requester}</span>
      </p>

      {task.observations && (
        <p className="mt-1 line-clamp-2 text-xs text-black/50 dark:text-white/50 truncate">
          {task.observations}
        </p>
      )}

      <p className="mt-2 text-[11px] text-black/40 dark:text-white/40">
        Atualizado em {formatDate(task.updated_at)}
      </p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
