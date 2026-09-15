"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAsCurrentUser, acceptInviteNewAccount } from "@/app/join/actions";

type Props = {
  token: string;
  groupName: string;
  alreadyMember: boolean;
  isLoggedIn: boolean;
  userEmail: string | null;
};

export default function JoinForm({ token, groupName, alreadyMember, isLoggedIn, userEmail }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleJoinAsCurrentUser() {
    setError(null);
    setPending(true);
    const result = await acceptInviteAsCurrentUser(token);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/groups/${result.data.groupId}`);
    router.refresh();
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await acceptInviteNewAccount(token, email, password, fullName);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/groups/${result.data.groupId}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Convite para {groupName}</h1>

      {isLoggedIn ? (
        alreadyMember ? (
          <>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Você ({userEmail}) já é membro deste grupo.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Ir para meus grupos
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Entrar neste grupo com a conta {userEmail}?
            </p>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleJoinAsCurrentUser}
              disabled={pending}
              className="mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {pending ? "Entrando..." : "Entrar no grupo"}
            </button>
          </>
        )
      ) : (
        <>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Crie sua conta para entrar no grupo.
          </p>
          <form onSubmit={handleCreateAccount} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">
                Nome (opcional)
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Seu nome"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="voce@empresa.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">
                Senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {pending ? "Criando conta..." : "Criar conta e entrar"}
            </button>
          </form>
          <p className="mt-4 text-xs text-black/40 dark:text-white/40">
            Já tem uma conta?{" "}
            <a href="/login" className="underline">
              Faça login
            </a>{" "}
            e abra este link de novo.
          </p>
        </>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40";
