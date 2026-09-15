"use client";

import { useEffect, useState } from "react";
import {
  createInvite,
  listInvites,
  removeMember,
  revokeInvite,
} from "@/app/groups/actions";
import { displayName, type GroupInvite, type GroupMember } from "@/lib/types";

type Props = {
  groupId: string;
  members: GroupMember[];
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
  onMembersChanged: (members: GroupMember[]) => void;
};

export default function MembersPanel({
  groupId,
  members,
  isAdmin,
  currentUserId,
  onClose,
  onMembersChanged,
}: Props) {
  const [invites, setInvites] = useState<GroupInvite[] | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [now] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    listInvites(groupId).then((result) => {
      if (result.ok) setInvites(result.data);
    });
  }, [groupId, isAdmin]);

  async function handleCreateInvite() {
    setError(null);
    setCreatingInvite(true);
    const result = await createInvite(groupId);
    setCreatingInvite(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInvites((prev) => [result.data, ...(prev ?? [])]);
  }

  async function handleCopy(invite: GroupInvite) {
    const link = `${window.location.origin}/join/${invite.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Não foi possível copiar o link. Copie manualmente: " + link);
    }
  }

  async function handleRevoke(inviteId: string) {
    setError(null);
    const result = await revokeInvite(groupId, inviteId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInvites(
      (prev) =>
        prev?.map((i) => (i.id === inviteId ? { ...i, revoked_at: new Date().toISOString() } : i)) ??
        null
    );
  }

  async function handleRemoveMember(userId: string) {
    setError(null);
    const result = await removeMember(groupId, userId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onMembersChanged(members.filter((m) => m.user_id !== userId));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Membros do grupo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 dark:border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{displayName(m.profile)}</p>
                <p className="text-xs text-black/50 dark:text-white/50">{m.profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.role === "admin" && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                    admin
                  </span>
                )}
                {isAdmin && m.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    remover
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Convidar por link</h3>
              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={creatingInvite}
                className="rounded-md bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >
                {creatingInvite ? "Gerando..." : "Gerar link"}
              </button>
            </div>
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              Quem abrir o link cria a própria conta e entra direto no grupo.
              Válido por 7 dias.
            </p>

            <ul className="mt-3 space-y-2">
              {(invites ?? []).map((invite) => {
                const revoked = Boolean(invite.revoked_at);
                const expired = new Date(invite.expires_at).getTime() < now;
                const inactive = revoked || expired;
                return (
                  <li
                    key={invite.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                      inactive
                        ? "border-black/10 text-black/40 dark:border-white/10 dark:text-white/40"
                        : "border-black/10 dark:border-white/10"
                    }`}
                  >
                    <span className="truncate font-mono">/join/{invite.id.slice(0, 8)}…</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {revoked ? (
                        <span>revogado</span>
                      ) : expired ? (
                        <span>expirado</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(invite)}
                            className="font-medium hover:underline"
                          >
                            {copiedId === invite.id ? "copiado!" : "copiar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(invite.id)}
                            className="font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            revogar
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
