"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/auth-actions";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-black/15 px-2.5 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
    >
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
