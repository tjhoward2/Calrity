import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusPicker } from "./FocusPicker";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ focus?: string }>;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { focus: focusId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("items")
    .select("id, content, status")
    .in("status", ["inbox", "active"])
    .order("created_at", { ascending: false });

  const openItems = items ?? [];
  if (openItems.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-xl font-medium">Today</h1>
        <p className="text-sm text-neutral-500">
          Nothing to focus on yet.{" "}
          <a href="/inbox" className="underline text-[#3B6EA5]">
            Capture a thought
          </a>{" "}
          first.
        </p>
      </main>
    );
  }

  const picked = focusId
    ? openItems.find((i) => i.id === focusId) ?? openItems[0]
    : openItems[0];

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">Today</h1>
        <a href="/inbox" className="text-xs text-neutral-500 hover:text-neutral-700">
          Inbox
        </a>
      </header>
      <FocusPicker pickedId={picked.id} items={openItems} />
    </main>
  );
}
