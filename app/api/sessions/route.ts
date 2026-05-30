import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PRD §9: POST /api/sessions — body: { item_id, planned_minutes? } → 201 { session }
export async function POST(request: NextRequest) {
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

  let body: {
    item_id?: unknown;
    planned_minutes?: unknown;
    drift_check_at?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_json", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  if (typeof body.item_id !== "string") {
    return NextResponse.json(
      { error: { code: "bad_input", message: "item_id required." } },
      { status: 400 },
    );
  }

  // Clamp 5–120 per PRD §9 validation.
  let plannedMinutes = 25;
  if (typeof body.planned_minutes === "number") {
    plannedMinutes = Math.max(5, Math.min(120, Math.round(body.planned_minutes)));
  }

  // Optional override for drift_check_at (seconds). Useful for testing the
  // drift check without waiting 50% of a real session. Clamped to avoid
  // negative or absurd values.
  let driftCheckOverride: number | null = null;
  if (typeof body.drift_check_at === "number") {
    driftCheckOverride = Math.max(
      10,
      Math.min(plannedMinutes * 60 - 30, Math.round(body.drift_check_at)),
    );
  }

  // Verify the item belongs to this user (RLS will filter; .maybeSingle()
  // returns null on RLS miss → we treat as 404).
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("id")
    .eq("id", body.item_id)
    .maybeSingle();
  if (itemErr) {
    return NextResponse.json(
      { error: { code: "db_error", message: itemErr.message } },
      { status: 500 },
    );
  }
  if (!item) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Focus item not found." } },
      { status: 404 },
    );
  }

  // PRD §5 US-F2: default drift check at ~50% of planned duration. Store as
  // seconds into the session for the client timer.
  const driftCheckAt =
    driftCheckOverride ?? Math.floor((plannedMinutes * 60) / 2);

  const { data: session, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: user.id,
      item_id: body.item_id,
      planned_minutes: plannedMinutes,
      drift_check_at: driftCheckAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  // Mark the item as active.
  await supabase
    .from("items")
    .update({ status: "active" })
    .eq("id", body.item_id);

  return NextResponse.json({ session }, { status: 201 });
}
