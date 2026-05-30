import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export function createAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

// Locked for M2 per session decision (2026-05-30): claude-haiku-4-5.
// Fast enough for the re-rail's <3s budget; capable enough for the
// constrained JSON output. M3 may pick a different model for the evening
// review without affecting this constant.
export const RERAIL_MODEL = "claude-haiku-4-5";
export const FOCUS_PICK_MODEL = "claude-haiku-4-5";
