import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OUTCOMES = new Set(["completed", "abandoned", "drifted_back"]);

// PRD §9: PATCH /api/sessions/[id] — body: { outcome } → 200 { session }.
// Sets ended_at + outcome.
export async function PATCH(
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

  let body: { outcome?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_json", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  if (typeof body.outcome !== "string" || !OUTCOMES.has(body.outcome)) {
    return NextResponse.json(
      { error: { code: "bad_input", message: "Invalid outcome." } },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("focus_sessions")
    .update({ outcome: body.outcome, ended_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Session not found." } },
      { status: 404 },
    );
  }

  // If the user marked the underlying item done as part of completing, the
  // item endpoint handles that — we don't auto-flip status here. Marking the
  // session "completed" doesn't necessarily mean the *item* is done.

  return NextResponse.json({ session: data });
}
