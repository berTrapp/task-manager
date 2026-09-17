"use client";

import { useMemo } from "react";
import { TASK_STATUSES, displayName, type GroupMember, type Task, type TaskStatus } from "@/lib/types";
import Column from "./Column";

const UNASSIGNED = "unassigned";

type Props = {
  members: GroupMember[];
  tasks: Task[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  collapsedStatuses?: Set<TaskStatus>;
  onToggleCollapse?: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
};

export default function UserTabsBoard({
  members,
  tasks,
  selectedUserId,
  onSelectUser,
  collapsedStatuses,
  onToggleCollapse,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onAddTask,
}: Props) {
  const tabs = useMemo(
    () => [
      ...members.map((m) => ({ id: m.user_id, label: displayName(m.profile) })),
      { id: UNASSIGNED, label: "Sem responsável" },
    ],
    [members]
  );

  const userTasks = useMemo(() => {
    const key = selectedUserId === UNASSIGNED ? null : selectedUserId;
    return tasks.filter((t) => t.assignee_id === key);
  }, [tasks, selectedUserId]);

  const columns = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = { aberto: [], desenvolvimento: [], concluido: [] };
    for (const task of userTasks) byStatus[task.status].push(task);
    for (const status of TASK_STATUSES) byStatus[status].sort((a, b) => a.position - b.position);
    return byStatus;
  }, [userTasks]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectUser(tab.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedUserId === tab.id
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/15"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:overflow-x-auto sm:pb-2">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            collapsed={collapsedStatuses?.has(status)}
            onToggleCollapse={onToggleCollapse ? () => onToggleCollapse(status) : undefined}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDuplicateTask={onDuplicateTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}
