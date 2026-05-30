import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickFocus } from "@/lib/focus-pick";

// PRD §9: POST /api/focus/pick — body: { energy_level? }.
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

  let body: { energy_level?: unknown } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = await request.json();
    }
  } catch {
    // Empty body is fine — energy_level is optional.
  }

  const energyLevel =
    typeof body.energy_level === "number" &&
    body.energy_level >= 1 &&
    body.energy_level <= 10
      ? body.energy_level
      : undefined;

  // Load open items (inbox + active) to choose among.
  const { data: items, error } = await supabase
    .from("items")
    .select("id, content")
    .in("status", ["inbox", "active"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "no_open_items",
          message: "Capture something first.",
        },
      },
      { status: 400 },
    );
  }

  const { result, metrics } = await pickFocus({
    candidates: items.map((i) => ({ id: i.id, content: i.content })),
    energyLevel,
  });

  // PRD §11 observability — structured log per AI call.
  console.log(
    JSON.stringify({
      route: "/api/focus/pick",
      user_id: user.id,
      ...metrics,
    }),
  );

  if (!result) {
    return NextResponse.json(
      { error: { code: "no_open_items", message: "Capture something first." } },
      { status: 400 },
    );
  }

  return NextResponse.json({
    focus_item_id: result.focus_item_id,
    one_liner: result.one_liner,
    fallback_used: result.fallback_used,
  });
}
