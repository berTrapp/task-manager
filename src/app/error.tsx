"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
        <h1 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Erro ao carregar as demandas
        </h1>
        <p className="text-sm text-red-700/80 dark:text-red-400/80">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
