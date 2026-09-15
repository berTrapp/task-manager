"use client";

import { useState } from "react";
import Link from "next/link";
import { createGroup } from "@/app/groups/actions";
import type { Group, GroupRole } from "@/lib/types";

type GroupWithMeta = Group & { role: GroupRole; memberCount: number };

export default function GroupList({ initialGroups }: { initialGroups: GroupWithMeta[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await createGroup(name);

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setGroups((prev) => [...prev, { ...result.data, role: "admin", memberCount: 1 }]);
    setName("");
    setCreating(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Meus grupos</h2>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          + Criar grupo
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex items-start gap-2 rounded-lg border border-black/10 bg-black/[.02] p-3 dark:border-white/10 dark:bg-white/[.03]"
        >
          <div className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do grupo (ex: Equipe Suporte)"
              className="w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40"
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            {pending ? "Criando..." : "Criar"}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
          Você ainda não faz parte de nenhum grupo. Crie um grupo ou peça um
          link de convite para alguém.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="block rounded-lg border border-black/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/[.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{group.name}</h3>
                  {group.role === "admin" && (
                    <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                      admin
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                  {group.memberCount} membro{group.memberCount === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
