import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Magic-link confirm route. Accepts both shapes Supabase may produce:
//
//   - `?code=<uuid>` — PKCE flow. Used by browser-initiated signInWithOtp
//     when the email template renders `{{ .ConfirmationURL }}` (Supabase's
//     default). The verify endpoint validates the OTP server-side, then
//     redirects here with the PKCE auth code. The code_verifier lives in a
//     browser cookie that @supabase/ssr's server client reads automatically
//     via the cookies adapter.
//
//   - `?token_hash=<hex>&type=magiclink` — direct OTP flow. Used when the
//     email template points straight at this route (skipping Supabase's
//     verify endpoint) and by admin-generated links. Calls verifyOtp.
//
// Either shape lands the user on `next` (default /today) on success, or on
// /login with an error otherwise.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/today";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam || errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=` +
        encodeURIComponent(errorDescription ?? errorParam ?? "Sign-in failed"),
    );
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=` +
      encodeURIComponent("Sign-in link expired or invalid. Try again."),
  );
}
