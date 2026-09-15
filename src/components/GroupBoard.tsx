"use client";

import { useState } from "react";
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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { deleteTask, reorderTasks } from "@/app/actions";
import { computeCellDrop } from "@/lib/kanban-dnd";
import type { GroupMember, Task, TaskStatus } from "@/lib/types";
import SwimlaneGrid, { swimlaneCellKey } from "./SwimlaneGrid";
import UserTabsBoard from "./UserTabsBoard";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import ConfirmDialog from "./ConfirmDialog";
import MembersPanel from "./MembersPanel";

type ViewMode = "swimlane" | "tabs";
type ModalState =
  | { mode: "create"; status: TaskStatus; assigneeId: string | null }
  | { mode: "edit"; task: Task };

const UNASSIGNED = "unassigned";

type Props = {
  groupId: string;
  initialTasks: Task[];
  initialMembers: GroupMember[];
  isAdmin: boolean;
  currentUserId: string;
};

export default function GroupBoard({
  groupId,
  initialTasks,
  initialMembers,
  isAdmin,
  currentUserId,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);
  const [view, setView] = useState<ViewMode>("swimlane");
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialMembers[0]?.user_id ?? UNASSIGNED
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function cellKeyOf(task: Task): string {
    if (view === "swimlane") return swimlaneCellKey(task.assignee_id, task.status);
    return task.status;
  }

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

    const relevantTasks =
      view === "tabs"
        ? tasks.filter(
            (t) => (t.assignee_id ?? UNASSIGNED) === selectedUserId
          )
        : tasks;
    const sorted = [...relevantTasks].sort((a, b) => a.position - b.position);

    const updates = computeCellDrop({ items: sorted, cellKeyOf, activeId, overId });
    if (!updates) return;

    const taskUpdates = updates.map((u) => {
      if (view === "swimlane") {
        const [assigneeKey, status] = u.cellKey.split("::");
        return {
          id: u.id,
          status: status as TaskStatus,
          assignee_id: assigneeKey === UNASSIGNED ? null : assigneeKey,
          position: u.position,
        };
      }
      return {
        id: u.id,
        status: u.cellKey as TaskStatus,
        assignee_id: selectedUserId === UNASSIGNED ? null : selectedUserId,
        position: u.position,
      };
    });

    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => {
        const u = taskUpdates.find((x) => x.id === t.id);
        return u ? { ...t, status: u.status, assignee_id: u.assignee_id, position: u.position } : t;
      })
    );

    const result = await reorderTasks(groupId, taskUpdates);
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
    const result = await deleteTask(groupId, deleteTarget.id);
    setDeletePending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function openCreateModal() {
    setModalState({
      mode: "create",
      status: "aberto",
      assigneeId: selectedUserId === UNASSIGNED ? null : selectedUserId,
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-full bg-black/5 p-1 text-sm dark:bg-white/10">
          <button
            type="button"
            onClick={() => setView("swimlane")}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              view === "swimlane"
                ? "bg-white text-black shadow-sm dark:bg-black dark:text-white"
                : "text-black/50 dark:text-white/50"
            }`}
          >
            Swimlanes
          </button>
          <button
            type="button"
            onClick={() => setView("tabs")}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              view === "tabs"
                ? "bg-white text-black shadow-sm dark:bg-black dark:text-white"
                : "text-black/50 dark:text-white/50"
            }`}
          >
            Por usuário
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMembersPanelOpen(true)}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            Membros ({members.length})
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            + Nova demanda
          </button>
        </div>
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
        id="group-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {view === "swimlane" ? (
          <SwimlaneGrid
            members={members}
            tasks={tasks}
            onEditTask={(task) => setModalState({ mode: "edit", task })}
            onDeleteTask={(task) => setDeleteTarget(task)}
          />
        ) : (
          <UserTabsBoard
            members={members}
            tasks={tasks}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            onEditTask={(task) => setModalState({ mode: "edit", task })}
            onDeleteTask={(task) => setDeleteTarget(task)}
            onAddTask={(status) =>
              setModalState({
                mode: "create",
                status,
                assigneeId: selectedUserId === UNASSIGNED ? null : selectedUserId,
              })
            }
          />
        )}

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalState && (
        <TaskModal
          groupId={groupId}
          members={members}
          mode={modalState.mode}
          task={modalState.mode === "edit" ? modalState.task : undefined}
          initialStatus={modalState.mode === "create" ? modalState.status : undefined}
          initialAssigneeId={modalState.mode === "create" ? modalState.assigneeId : undefined}
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

      {membersPanelOpen && (
        <MembersPanel
          groupId={groupId}
          members={members}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onClose={() => setMembersPanelOpen(false)}
          onMembersChanged={setMembers}
        />
      )}
    </div>
  );
}
