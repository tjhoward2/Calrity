import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PRD §9: PATCH allows status, importance, effort, energy, urgency,
// scheduled_for. Other fields are rejected.
const ALLOWED = new Set([
  "status",
  "importance",
  "effort",
  "energy",
  "urgency",
  "scheduled_for",
]);

const STATUSES = new Set(["inbox", "active", "done", "parked"]);
const EFFORTS = new Set(["xs", "s", "m", "l", "xl"]);
const ENERGIES = new Set(["low", "med", "high"]);

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_json", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED.has(key)) {
      return NextResponse.json(
        { error: { code: "unknown_field", message: `Unknown field: ${key}` } },
        { status: 400 },
      );
    }
    if (key === "status" && (typeof value !== "string" || !STATUSES.has(value))) {
      return NextResponse.json(
        { error: { code: "bad_input", message: `Invalid status: ${value}` } },
        { status: 400 },
      );
    }
    if (key === "effort" && value !== null && (typeof value !== "string" || !EFFORTS.has(value))) {
      return NextResponse.json(
        { error: { code: "bad_input", message: `Invalid effort: ${value}` } },
        { status: 400 },
      );
    }
    if (key === "energy" && value !== null && (typeof value !== "string" || !ENERGIES.has(value))) {
      return NextResponse.json(
        { error: { code: "bad_input", message: `Invalid energy: ${value}` } },
        { status: 400 },
      );
    }
    if (
      (key === "importance" || key === "urgency") &&
      value !== null &&
      (typeof value !== "number" || value < 1 || value > 5)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "bad_input",
            message: `Invalid ${key}: expected number 1–5.`,
          },
        },
        { status: 400 },
      );
    }
    update[key] = value;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: { code: "bad_input", message: "No fields to update." } },
      { status: 400 },
    );
  }

  // US-E1: marking done sets completed_at; un-doneing clears it.
  if (update.status === "done") {
    update.completed_at = new Date().toISOString();
  } else if (typeof update.status === "string" && update.status !== "done") {
    update.completed_at = null;
  }

  const { data, error } = await supabase
    .from("items")
    .update(update)
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
    // RLS filtered the row out OR it doesn't exist. Both look like 404 to
    // the caller — they shouldn't be able to distinguish.
    return NextResponse.json(
      { error: { code: "not_found", message: "Item not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ item: data });
}
