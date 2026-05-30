"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=" + encodeURIComponent("Please enter your email."));
  }

  const supabase = await createClient();

  // Build the absolute origin from request headers so the magic link works
  // for both http://localhost:3000 and the deployed URL without hardcoding.
  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  redirect("/login?sent=1");
}
