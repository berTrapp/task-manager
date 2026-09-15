import { getTasks } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import Board from "@/components/Board";
import SetupNotice from "@/components/SetupNotice";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const tasks = await getTasks();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-black/10 dark:border-white/10 px-4 py-4 sm:px-8">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Gestão de Demandas
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Acompanhe demandas do quadro Aberto → Desenvolvimento → Concluído.
        </p>
      </header>
      <div className="flex-1 px-4 py-6 sm:px-8">
        <Board initialTasks={tasks} />
      </div>
    </main>
  );
}
