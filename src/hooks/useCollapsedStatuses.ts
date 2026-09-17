"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TaskStatus } from "@/lib/types";

const EMPTY = new Set<TaskStatus>();
const listeners = new Set<() => void>();
const snapshotCache = new Map<string, { raw: string | null; value: Set<TaskStatus> }>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readCollapsed(key: string): Set<TaskStatus> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }

  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value;

  let value: Set<TaskStatus>;
  try {
    value = raw ? new Set(JSON.parse(raw) as TaskStatus[]) : new Set();
  } catch {
    value = new Set();
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useCollapsedStatuses(groupId: string) {
  const storageKey = `board-collapsed-${groupId}`;

  const collapsedStatuses = useSyncExternalStore(
    subscribe,
    () => readCollapsed(storageKey),
    getServerSnapshot
  );

  const toggleCollapse = useCallback(
    (status: TaskStatus) => {
      const current = readCollapsed(storageKey);
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignore unavailable storage
      }
      emitChange();
    },
    [storageKey]
  );

  return [collapsedStatuses, toggleCollapse] as const;
}
