"use client";

import { useMemo } from "react";
import {
  TASK_STATUSES,
  STATUS_LABELS,
  displayName,
  type GroupMember,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import SwimlaneCell from "./SwimlaneCell";
import ChevronIcon from "./ChevronIcon";

type Props = {
  members: GroupMember[];
  tasks: Task[];
  collapsedStatuses?: Set<TaskStatus>;
  onToggleCollapse?: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
};

const UNASSIGNED = "unassigned";

export function swimlaneCellKey(assigneeId: string | null, status: string) {
  return `${assigneeId ?? UNASSIGNED}::${status}`;
}

export default function SwimlaneGrid({
  members,
  tasks,
  collapsedStatuses,
  onToggleCollapse,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
}: Props) {
  const rows = useMemo(() => {
    const byAssignee = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.assignee_id ?? UNASSIGNED;
      if (!byAssignee.has(key)) byAssignee.set(key, []);
      byAssignee.get(key)!.push(task);
    }
    for (const list of byAssignee.values()) list.sort((a, b) => a.position - b.position);

    const memberRows = members.map((m) => ({
      key: m.user_id,
      label: displayName(m.profile),
      tasks: byAssignee.get(m.user_id) ?? [],
    }));
    const unassignedTasks = byAssignee.get(UNASSIGNED) ?? [];

    return unassignedTasks.length > 0
      ? [...memberRows, { key: UNASSIGNED, label: "Sem responsável", tasks: unassignedTasks }]
      : memberRows;
  }, [members, tasks]);

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[820px] gap-2"
        style={{ gridTemplateColumns: "160px repeat(3, minmax(220px, 1fr))" }}
      >
        <div />
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className="flex items-center gap-1.5 rounded-md bg-black/[.03] px-3 py-2 text-sm font-semibold dark:bg-white/[.05]"
          >
            {onToggleCollapse && (
              <button
                type="button"
                onClick={() => onToggleCollapse(status)}
                className="rounded p-0.5 text-black/40 hover:bg-black/10 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
                aria-label={collapsedStatuses?.has(status) ? "Expandir coluna" : "Recolher coluna"}
              >
                <ChevronIcon direction={collapsedStatuses?.has(status) ? "down" : "up"} />
              </button>
            )}
            {STATUS_LABELS[status]}
          </div>
        ))}

        {rows.map((row) => (
          <div key={row.key} className="contents">
            <div className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-black/70 dark:text-white/70">
              {row.label}
            </div>
            {TASK_STATUSES.map((status) => (
              <SwimlaneCell
                key={status}
                cellKey={swimlaneCellKey(row.key === UNASSIGNED ? null : row.key, status)}
                tasks={row.tasks.filter((t) => t.status === status)}
                collapsed={collapsedStatuses?.has(status)}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onDuplicateTask={onDuplicateTask}
              />
            ))}
          </div>
        ))}

        {rows.length === 0 && (
          <p className="col-span-4 rounded-lg border border-dashed border-black/15 p-6 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
            Nenhum membro neste grupo ainda.
          </p>
        )}
      </div>
    </div>
  );
}
