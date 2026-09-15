"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Task } from "@/lib/types";

/**
 * Keeps `tasks` in sync with changes made by other users in the same group,
 * via a read-only Supabase Realtime subscription (gated by the RLS policy
 * on `tasks` — see supabase/schema.sql). Writes still go exclusively
 * through Server Actions; this only listens.
 */
export function useGroupRealtimeTasks(groupId: string, setTasks: Dispatch<SetStateAction<Task[]>>) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // A unique-per-mount topic avoids a known Supabase Realtime trip-up:
    // React Strict Mode (on by default in dev) mounts, cleans up, and
    // re-mounts every effect once. Reusing the exact same channel topic
    // across that rapid subscribe/unsubscribe/resubscribe cycle can leave
    // the second subscription stuck, since the server can still be
    // processing the first channel's leave when the second one joins.
    const topic = `tasks-group-${groupId}-${Math.random().toString(36).slice(2)}`;

    async function start() {
      // createBrowserClient restores the session from cookies
      // asynchronously. Subscribing before that finishes joins the
      // channel as anonymous — RLS then hides every row, since the
      // realtime auth doesn't get retroactively upgraded for a channel
      // that's already joined. Wait for the real session first.
      await supabase!.auth.getSession();
      if (cancelled) return;

      channel = supabase!
        .channel(topic)
        .on<Task>(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks", filter: `group_id=eq.${groupId}` },
          (payload) => {
            setTasks((prev) => {
              if (payload.eventType === "DELETE") {
                const oldId = (payload.old as Partial<Task>).id;
                return oldId ? prev.filter((t) => t.id !== oldId) : prev;
              }
              const incoming = payload.new as Task;
              const exists = prev.some((t) => t.id === incoming.id);
              return exists
                ? prev.map((t) => (t.id === incoming.id ? incoming : t))
                : [...prev, incoming];
            });
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.info(`[realtime] connected (${topic})`);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.error(`[realtime] ${status} (${topic})`, err);
          }
        });
    }

    start();

    return () => {
      cancelled = true;
      if (channel) supabase!.removeChannel(channel);
    };
  }, [groupId, setTasks]);
}
