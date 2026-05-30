/**
 * Two-account RLS isolation test (PRD §12).
 *
 * Verifies — at the database layer, not the API layer — that:
 *   - account B cannot SELECT account A's items
 *   - account B cannot UPDATE account A's items
 *   - account B cannot DELETE account A's items
 *
 * Uses the admin client (secret key, bypasses RLS) to seed two users + data,
 * then exercises queries as each user via signed JWTs.
 *
 * Run with: `npx tsx scripts/rls-isolation-test.ts`
 */

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// .env.local mirrors what next dev reads; .env is a fallback.
loadEnv({ path: ".env.local" });
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SECRET = process.env.SUPABASE_SECRET_KEY!;

if (!URL || !PUBLISHABLE || !SECRET) {
  console.error("Missing env vars. Source .env.local first.");
  process.exit(2);
}

// Node < 22 has no native WebSocket; @supabase/supabase-js's realtime client
// needs one even though this script never uses realtime. Pass `ws`.
import WebSocket from "ws";
const realtimeOpts = { transport: WebSocket as unknown as typeof globalThis.WebSocket };

const admin = createClient(URL, SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: realtimeOpts,
});

const TAG = `rls-test-${Date.now()}`;
const emailA = `${TAG}-a@example.com`;
const emailB = `${TAG}-b@example.com`;

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  const mark = pass ? "✓" : "✗";
  // eslint-disable-next-line no-console
  console.log(`  ${mark} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`\nRLS isolation test — tag=${TAG}\n`);

  // 1. Create two users via admin
  const { data: userA, error: aErr } = await admin.auth.admin.createUser({
    email: emailA,
    email_confirm: true,
  });
  if (aErr || !userA?.user) throw new Error(`create A: ${aErr?.message}`);
  const { data: userB, error: bErr } = await admin.auth.admin.createUser({
    email: emailB,
    email_confirm: true,
  });
  if (bErr || !userB?.user) throw new Error(`create B: ${bErr?.message}`);
  console.log(`  created users  A=${userA.user.id}  B=${userB.user.id}`);

  // 2. Seed an item for A (admin bypasses RLS)
  const { data: itemA, error: insErr } = await admin
    .from("items")
    .insert({ content: `${TAG}: A's secret`, user_id: userA.user.id })
    .select()
    .single();
  if (insErr || !itemA) throw new Error(`seed A item: ${insErr?.message}`);
  console.log(`  seeded item    id=${itemA.id} owner=A`);

  // 3. Build per-user clients using a fresh sign-in to get access tokens
  async function clientForUser(email: string) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) throw error;
    const hash =
      data.properties?.hashed_token ?? (data.properties as { token_hash?: string } | undefined)?.token_hash;
    if (!hash) throw new Error("admin generateLink returned no token_hash");
    // Use a fresh client to verify the OTP and capture the session token
    const tmp = createClient(URL, PUBLISHABLE, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: realtimeOpts,
    });
    const { data: verified, error: verErr } = await tmp.auth.verifyOtp({
      type: "magiclink",
      token_hash: hash,
    });
    if (verErr || !verified.session) throw verErr ?? new Error("no session");
    // Build the final client with that bearer token attached
    return createClient(URL, PUBLISHABLE, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: realtimeOpts,
      global: {
        headers: { Authorization: `Bearer ${verified.session.access_token}` },
      },
    });
  }

  const clientA = await clientForUser(emailA);
  const clientB = await clientForUser(emailB);

  // 4. Sanity: account A sees their own item
  const { data: aSees } = await clientA
    .from("items")
    .select("id, content")
    .eq("id", itemA.id);
  check(
    "A can SELECT own item",
    !!aSees && aSees.length === 1,
    `rows returned: ${aSees?.length}`,
  );

  // 5. Critical: account B cannot SELECT A's item
  const { data: bSees } = await clientB
    .from("items")
    .select("id, content")
    .eq("id", itemA.id);
  check(
    "B cannot SELECT A's item",
    !bSees || bSees.length === 0,
    `rows visible to B: ${bSees?.length ?? 0}`,
  );

  // 6. Critical: account B cannot UPDATE A's item
  const { data: bUpdate } = await clientB
    .from("items")
    .update({ content: "PWNED" })
    .eq("id", itemA.id)
    .select();
  check(
    "B cannot UPDATE A's item",
    !bUpdate || bUpdate.length === 0,
    `rows updated by B: ${bUpdate?.length ?? 0}`,
  );
  // Re-read via admin to confirm the content didn't change
  const { data: postUpdate } = await admin
    .from("items")
    .select("content")
    .eq("id", itemA.id)
    .single();
  check(
    "A's item content survived B's UPDATE attempt",
    postUpdate?.content === `${TAG}: A's secret`,
    `content now: ${JSON.stringify(postUpdate?.content)}`,
  );

  // 7. Critical: account B cannot DELETE A's item
  const { data: bDelete } = await clientB
    .from("items")
    .delete()
    .eq("id", itemA.id)
    .select();
  check(
    "B cannot DELETE A's item",
    !bDelete || bDelete.length === 0,
    `rows deleted by B: ${bDelete?.length ?? 0}`,
  );
  const { data: stillThere } = await admin
    .from("items")
    .select("id")
    .eq("id", itemA.id)
    .maybeSingle();
  check(
    "A's item still exists after B's DELETE attempt",
    !!stillThere,
    stillThere ? "found" : "MISSING",
  );

  // 8. Cleanup
  await admin.from("items").delete().eq("id", itemA.id);
  await admin.auth.admin.deleteUser(userA.user.id);
  await admin.auth.admin.deleteUser(userB.user.id);
  console.log(`\n  cleaned up test users + rows`);

  // Summary
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${failed.length === 0 ? "✓ ALL PASSED" : `✗ ${failed.length} FAILED`}  (${results.length} checks)\n`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\n✗ test runner crashed:", err);
  process.exit(2);
});
