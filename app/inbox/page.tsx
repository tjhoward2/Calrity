import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaptureBar } from "./CaptureBar";
import { ItemList, type Item } from "./ItemList";
import { SignOut } from "./SignOut";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("items")
    .select("id, content, status, created_at, completed_at")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">Inbox</h1>
        <SignOut email={user.email ?? ""} />
      </header>
      <CaptureBar />
      <ItemList initialItems={(items ?? []) as Item[]} />
    </main>
  );
}
