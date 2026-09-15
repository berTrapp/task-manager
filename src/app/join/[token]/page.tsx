import { getInvitePreview } from "@/app/join/actions";
import { getCurrentUser } from "@/lib/supabase/auth";
import JoinForm from "@/components/JoinForm";

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;

  const preview = await getInvitePreview(token);
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        {!preview.ok ? (
          <>
            <h1 className="text-lg font-semibold">Convite inválido</h1>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">{preview.error}</p>
          </>
        ) : (
          <JoinForm
            token={token}
            groupName={preview.data.groupName}
            alreadyMember={preview.data.alreadyMember}
            isLoggedIn={Boolean(user)}
            userEmail={user?.email ?? null}
          />
        )}
      </div>
    </main>
  );
}
