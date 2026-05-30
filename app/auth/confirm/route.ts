import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase magic-link flow: the email link hits Supabase's /auth/v1/verify,
// which 302s here with a `code` query param. We exchange it for a session
// (sets auth cookies via @supabase/ssr) and redirect to /inbox.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/inbox";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=` +
      encodeURIComponent("Sign-in link expired or invalid. Try again."),
  );
}
