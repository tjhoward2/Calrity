"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOut({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-xs text-neutral-500">
      <span className="hidden sm:inline">{email}</span>
      <button
        onClick={() =>
          startTransition(async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.replace("/login");
            router.refresh();
          })
        }
        disabled={pending}
        className="hover:text-neutral-700 disabled:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
