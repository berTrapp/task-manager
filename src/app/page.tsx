import { redirect } from "next/navigation";
import { getTasks } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import Board from "@/components/Board";
import SetupNotice from "@/components/SetupNotice";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await getTasks();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Gestão de Demandas
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Acompanhe demandas do quadro Aberto → Desenvolvimento → Concluído.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-black/50 dark:text-white/50 sm:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex-1 px-4 py-6 sm:px-8">
        <Board initialTasks={tasks} />
      </div>
    </main>
  );
}
