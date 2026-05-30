import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rerail } from "@/lib/rerail";

const REASONS = new Set([
  "tab_site",
  "person_message",
  "thought",
  "other",
  "unspecified",
]);

type CoachState = {
  drift_patterns?: Array<{
    trigger: string;
    count: number;
    last_seen?: string;
  }>;
};

// PRD §9 + §10.2b: POST /api/sessions/[id]/drift
// Body: { reason?, note? }
// Inserts a drift_events row, then calls the re-rail (Claude) and returns
// { message, next_action, fallback_used }.
export async function POST(
  request: NextRequest,
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

  let body: { reason?: unknown; note?: unknown } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = await request.json();
    }
  } catch {
    // empty body is fine — reason defaults to 'unspecified'
  }

  const reason =
    typeof body.reason === "string" && REASONS.has(body.reason)
      ? body.reason
      : "unspecified";
  const note =
    typeof body.note === "string" && body.note.trim().length > 0
      ? body.note.trim().slice(0, 280)
      : null;

  // Load session + linked item content (RLS scopes to this user).
  const { data: session, error: sessErr } = await supabase
    .from("focus_sessions")
    .select("id, item_id, items(content)")
    .eq("id", id)
    .maybeSingle();
  if (sessErr) {
    return NextResponse.json(
      { error: { code: "db_error", message: sessErr.message } },
      { status: 500 },
    );
  }
  if (!session) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 },
    );
  }

  // Supabase types FK joins as arrays even for many-to-one; coerce.
  const joinedItems = (session as { items?: { content: string }[] | { content: string } | null }).items;
  const focusTask = Array.isArray(joinedItems)
    ? joinedItems[0]?.content ?? "your focus task"
    : joinedItems?.content ?? "your focus task";

  // Drift patterns are empty for M2 — the evening review (M3) populates
  // them. The re-rail handles an empty array.
  const { data: coachRow } = await supabase
    .from("coach_state")
    .select("state")
    .maybeSingle();
  const driftPatterns = (coachRow?.state as CoachState | null)?.drift_patterns ?? [];

  // Record the drift event BEFORE the AI call so we never lose drift data
  // if the AI errors. This matters for M3 pattern detection.
  const { data: driftEvent, error: insErr } = await supabase
    .from("drift_events")
    .insert({
      user_id: user.id,
      session_id: id,
      reason,
      note,
    })
    .select()
    .single();
  if (insErr || !driftEvent) {
    return NextResponse.json(
      {
        error: {
          code: "db_error",
          message: insErr?.message ?? "Failed to log drift.",
        },
      },
      { status: 500 },
    );
  }

  const { result, metrics } = await rerail({
    focusTask,
    driftPatterns,
  });

  // PRD §11 observability + §10.5 token logging.
  console.log(
    JSON.stringify({
      route: "/api/sessions/[id]/drift",
      user_id: user.id,
      session_id: id,
      drift_event_id: driftEvent.id,
      ...metrics,
    }),
  );

  return NextResponse.json({ ...result, drift_event_id: driftEvent.id });
}
