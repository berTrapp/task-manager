"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { deleteTask, reorderTasks } from "@/app/actions";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import ConfirmDialog from "./ConfirmDialog";

type ModalState = { mode: "create"; status: TaskStatus } | { mode: "edit"; task: Task };

function columnStatusFromId(id: string): TaskStatus | null {
  if (!id.startsWith("col:")) return null;
  const status = id.slice(4) as TaskStatus;
  return TASK_STATUSES.includes(status) ? status : null;
}

export default function Board({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = { aberto: [], desenvolvimento: [], concluido: [] };
    for (const task of tasks) byStatus[task.status].push(task);
    for (const status of TASK_STATUSES) byStatus[status].sort((a, b) => a.position - b.position);
    return byStatus;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceTask = tasks.find((t) => t.id === activeId);
    if (!sourceTask) return;

    const destStatus = columnStatusFromId(overId) ?? tasks.find((t) => t.id === overId)?.status;
    if (!destStatus) return;

    const sourceStatus = sourceTask.status;
    const previousTasks = tasks;

    const sourceIds = columns[sourceStatus].map((t) => t.id);
    const destIds = sourceStatus === destStatus ? sourceIds : columns[destStatus].map((t) => t.id);
    const fromIndex = sourceIds.indexOf(activeId);

    let newSourceIds = sourceIds;
    let newDestIds = destIds;

    if (sourceStatus === destStatus) {
      const overIndex = columnStatusFromId(overId) ? destIds.length - 1 : destIds.indexOf(overId);
      newDestIds = arrayMove(destIds, fromIndex, overIndex === -1 ? destIds.length - 1 : overIndex);
    } else {
      newSourceIds = sourceIds.filter((id) => id !== activeId);
      const overIndex = columnStatusFromId(overId) ? destIds.length : destIds.indexOf(overId);
      newDestIds = [...destIds];
      newDestIds.splice(overIndex === -1 ? destIds.length : overIndex, 0, activeId);
    }

    const positionById = new Map<string, { status: TaskStatus; position: number }>();
    newDestIds.forEach((id, index) => positionById.set(id, { status: destStatus, position: index }));
    if (sourceStatus !== destStatus) {
      newSourceIds.forEach((id, index) => positionById.set(id, { status: sourceStatus, position: index }));
    }

    setTasks((prev) =>
      prev.map((t) => {
        const update = positionById.get(t.id);
        return update ? { ...t, status: update.status, position: update.position } : t;
      })
    );

    const updates = Array.from(positionById.entries()).map(([id, v]) => ({
      id,
      status: v.status,
      position: v.position,
    }));
    const result = await reorderTasks(updates);
    if (!result.ok) {
      setTasks(previousTasks);
      setError(result.error);
    }
  }

  function handleSaved(task: Task, mode: "create" | "edit") {
    setTasks((prev) =>
      mode === "create" ? [...prev, task] : prev.map((t) => (t.id === task.id ? task : t))
    );
    setModalState(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteTask(deleteTarget.id);
    setDeletePending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-black/50 dark:text-white/50">
          {tasks.length} demanda{tasks.length === 1 ? "" : "s"} no total
        </p>
        <button
          type="button"
          onClick={() => setModalState({ mode: "create", status: "aberto" })}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          + Nova demanda
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-medium underline">
            fechar
          </button>
        </div>
      )}

      <DndContext
        id="tasks-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:overflow-x-auto sm:pb-2">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              onEditTask={(task) => setModalState({ mode: "edit", task })}
              onDeleteTask={(task) => setDeleteTarget(task)}
              onAddTask={(s) => setModalState({ mode: "create", status: s })}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalState && (
        <TaskModal
          mode={modalState.mode}
          task={modalState.mode === "edit" ? modalState.task : undefined}
          initialStatus={modalState.mode === "create" ? modalState.status : undefined}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir demanda"
          description={`Tem certeza que deseja excluir "${deleteTarget.description}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          pending={deletePending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
