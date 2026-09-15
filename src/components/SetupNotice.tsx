export default function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-xl space-y-4 rounded-lg border border-black/10 bg-black/[.02] p-6 dark:border-white/10 dark:bg-white/[.03]">
        <h1 className="text-lg font-semibold">Configure o Supabase</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          Este app precisa de um projeto Supabase para armazenar as demandas.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-black/70 dark:text-white/70">
          <li>
            Crie um projeto em{" "}
            <span className="font-mono text-xs">supabase.com</span>.
          </li>
          <li>
            Rode o SQL em{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">
              supabase/schema.sql
            </code>{" "}
            no SQL Editor do projeto.
          </li>
          <li>
            Copie{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">
              .env.local.example
            </code>{" "}
            para{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">
              .env.local
            </code>{" "}
            e preencha com a URL, a{" "}
            <span className="font-medium">publishable key</span> e a{" "}
            <span className="font-medium">secret key</span> do seu projeto
            (Project Settings → API).
          </li>
          <li>
            Crie os usuários que poderão fazer login em Authentication →
            Users no painel do Supabase (não há cadastro público nesta
            aplicação).
          </li>
          <li>Reinicie o servidor de desenvolvimento.</li>
        </ol>
      </div>
    </main>
  );
}
