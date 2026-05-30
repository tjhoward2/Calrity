import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusSession } from "./FocusSession";

export const dynamic = "force-dynamic";

export default async function FocusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("id, item_id, planned_minutes, drift_check_at, started_at, ended_at, outcome, items(content)")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  // If already ended, send back to /today.
  if (session.ended_at) redirect("/today");

  const joinedItems = (session as { items?: { content: string }[] | { content: string } | null }).items;
  const focusTask = Array.isArray(joinedItems)
    ? joinedItems[0]?.content ?? "your focus task"
    : joinedItems?.content ?? "your focus task";

  return (
    <FocusSession
      sessionId={session.id}
      focusTask={focusTask}
      plannedMinutes={session.planned_minutes}
      driftCheckAt={session.drift_check_at ?? Math.floor((session.planned_minutes * 60) / 2)}
      startedAtIso={session.started_at}
    />
  );
}
