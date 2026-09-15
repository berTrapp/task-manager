import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { listMyGroups } from "@/app/groups/actions";
import SetupNotice from "@/components/SetupNotice";
import SignOutButton from "@/components/SignOutButton";
import GroupList from "@/components/GroupList";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await listMyGroups();
  if (!result.ok) throw new Error(result.error);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Gestão de Demandas
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Escolha um grupo para ver o quadro de demandas.
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
        <GroupList initialGroups={result.data} />
      </div>
    </main>
  );
}
