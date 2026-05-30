import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PRD §9: POST /api/sessions/[id]/return — marks the most recent drift event
// for this session as returned + increments rerail_count.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthenticated", message: "Sign in required." } },
      { status: 401 },
    );
  }

  // Mark the latest drift event for this session as returned.
  const { data: latestDrift } = await supabase
    .from("drift_events")
    .select("id")
    .eq("session_id", id)
    .order("at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestDrift) {
    await supabase
      .from("drift_events")
      .update({ returned: true })
      .eq("id", latestDrift.id);
  }

  // Increment rerail_count via RPC-style update (read then write — RLS
  // guarantees we can only mutate our own row, so this is safe at single-
  // user concurrency).
  const { data: current } = await supabase
    .from("focus_sessions")
    .select("rerail_count")
    .eq("id", id)
    .maybeSingle();

  if (!current) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 },
    );
  }

  const { data: updated, error } = await supabase
    .from("focus_sessions")
    .update({ rerail_count: (current.rerail_count ?? 0) + 1 })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: updated });
}
