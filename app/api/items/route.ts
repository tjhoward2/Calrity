import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["inbox", "active", "done", "parked"]);

function authError() {
  return NextResponse.json(
    { error: { code: "unauthenticated", message: "Sign in required." } },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return authError();

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_json", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: { code: "bad_input", message: "`content` must be a string." } },
      { status: 400 },
    );
  }
  const content = body.content.trim();
  if (content.length < 1 || content.length > 2000) {
    return NextResponse.json(
      {
        error: {
          code: "bad_input",
          message: "`content` must be 1–2000 characters.",
        },
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("items")
    .insert({ content, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return authError();

  const status = new URL(request.url).searchParams.get("status");
  if (status && !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: { code: "bad_input", message: `Invalid status: ${status}` } },
      { status: 400 },
    );
  }

  let query = supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ items: data ?? [] });
}
