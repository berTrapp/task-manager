"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn(email, password);

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h1 className="text-lg font-semibold">Gestão de Demandas</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Entre com sua conta para acessar o quadro.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
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
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-black/40 dark:text-white/40">
          Não tem uma conta? Peça para um administrador te criar no painel do
          Supabase (Authentication → Users).
        </p>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40";
