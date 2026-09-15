import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getGroupForUser, listGroupMembers } from "@/app/groups/actions";
import { getTasks } from "@/app/actions";
import { getCurrentUser } from "@/lib/supabase/auth";
import GroupBoard from "@/components/GroupBoard";
import SignOutButton from "@/components/SignOutButton";

export default async function GroupPage({ params }: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groupResult = await getGroupForUser(groupId);
  if (!groupResult.ok) notFound();

  const membersResult = await listGroupMembers(groupId);
  if (!membersResult.ok) throw new Error(membersResult.error);

  const tasks = await getTasks(groupId);

  const { group, role } = groupResult.data;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-8">
        <div>
          <Link
            href="/"
            className="text-xs text-black/50 hover:underline dark:text-white/50"
          >
            ← Meus grupos
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{group.name}</h1>
        </div>
        <SignOutButton />
      </header>
      <div className="flex-1 px-4 py-6 sm:px-8">
        <GroupBoard
          groupId={groupId}
          initialTasks={tasks}
          initialMembers={membersResult.data}
          isAdmin={role === "admin"}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
