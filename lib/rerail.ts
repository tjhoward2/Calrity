import "server-only";
import { createAnthropicClient, RERAIL_MODEL } from "./anthropic";

// PRD §10.4 — fixed server-side. User content never enters the system prompt
// (prompt-injection defense).
const SYSTEM_PROMPT = `You are the reasoning engine for an ADHD focus tool. You do three jobs: (1) pick the single most important task, (2) re-rail the user the instant they drift, and (3) at day's end, name their recurring drift triggers. Tone: firm, direct, tough-love — but NEVER cruel, NEVER shaming the person's worth, NEVER acting as a therapist or doctor.

Rules:
- Re-rail: name the focus task and the smallest possible next PHYSICAL action; be brief; zero guilt or failure language. A drift is normal, not a failure.
- Pattern-naming: only assert a recurring trigger when the drift events actually support it; do not invent.
- Break tasks into the smallest possible next physical action; if heavy, split smaller.
- Respond with ONLY valid JSON matching the requested schema. No prose. No markdown fences.`;

// PRD §5 US-F2 hard acceptance criterion: re-rail never shames. Two layers
// defend this — the system prompt above and this denylist as a safety net.
const SHAMING_DENYLIST = [
  "fail",
  "failed",
  "failure",
  "failing",
  "lazy",
  "laziness",
  "weak",
  "weakness",
  "shame",
  "shameful",
  "shaming",
  "ashamed",
  "disappoint",
  "wasted",
  "wasting your",
  "wasting time",
  "pathetic",
  "loser",
  "broken",
  "useless",
  "stupid",
  "idiot",
  "incompetent",
  "should know better",
  "what's wrong with you",
];

// 200ms margin under the 3s hard budget so the server can still respond.
const BUDGET_MS = 2800;
const MAX_OUTPUT_TOKENS = 256;

export type RerailResult = {
  message: string;
  next_action: string;
  fallback_used: boolean;
};

export type RerailInput = {
  focusTask: string;
  driftPatterns?: Array<{
    trigger: string;
    count: number;
    last_seen?: string;
  }>;
};

export type RerailMetrics = {
  latency_ms: number;
  fallback_used: boolean;
  fallback_reason?:
    | "timeout"
    | "parse_failure"
    | "shaming_blocked"
    | "api_error"
    | "empty";
  input_tokens?: number;
  output_tokens?: number;
};

function staticFallback(focusTask: string): RerailResult {
  return {
    message: "One task. Back to it.",
    next_action: focusTask,
    fallback_used: true,
  };
}

function containsShaming(text: string): boolean {
  const lower = text.toLowerCase();
  return SHAMING_DENYLIST.some((phrase) => lower.includes(phrase));
}

function tryParseRerailJson(
  text: string,
): { message: string; next_action: string } | null {
  // Strip code fences in case the model wraps despite instructions.
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (
      typeof obj === "object" &&
      obj !== null &&
      typeof obj.message === "string" &&
      typeof obj.next_action === "string" &&
      obj.message.trim().length > 0 &&
      obj.next_action.trim().length > 0
    ) {
      return { message: obj.message.trim(), next_action: obj.next_action.trim() };
    }
  } catch {
    // fall through
  }
  return null;
}

function buildUserMessage(input: RerailInput): string {
  // User content sent as its own message — never concatenated into the system
  // prompt (PRD §7.3 trust boundary).
  return JSON.stringify({
    focus_task: input.focusTask,
    drift_patterns: input.driftPatterns ?? [],
    response_schema: {
      message: "firm, non-shaming line naming the focus task",
      next_action: "the smallest possible next physical action",
    },
    instruction:
      "The user just reported drifting during a focus session. Generate a re-rail. Return ONLY the JSON object — no prose, no fences.",
  });
}

export async function rerail(
  input: RerailInput,
): Promise<{ result: RerailResult; metrics: RerailMetrics }> {
  const startedAt = Date.now();
  const fallback = staticFallback(input.focusTask);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BUDGET_MS);

  const userMessage = buildUserMessage(input);
  const client = createAnthropicClient();

  let lastParseFailure = false;
  let lastUsage:
    | { input_tokens: number; output_tokens: number }
    | undefined;
  let apiErrored = false;

  try {
    // PRD §10.1 — retry once on parse/validation failure.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (controller.signal.aborted) break;
      try {
        const response = await client.messages.create(
          {
            model: RERAIL_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
          },
          { signal: controller.signal },
        );

        lastUsage = {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        };

        const textBlock = response.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          lastParseFailure = true;
          continue;
        }

        const parsed = tryParseRerailJson(textBlock.text);
        if (!parsed) {
          lastParseFailure = true;
          continue;
        }

        if (containsShaming(parsed.message) || containsShaming(parsed.next_action)) {
          return {
            result: fallback,
            metrics: {
              latency_ms: Date.now() - startedAt,
              fallback_used: true,
              fallback_reason: "shaming_blocked",
              ...lastUsage,
            },
          };
        }

        return {
          result: { ...parsed, fallback_used: false },
          metrics: {
            latency_ms: Date.now() - startedAt,
            fallback_used: false,
            ...lastUsage,
          },
        };
      } catch (err) {
        if (controller.signal.aborted) break;
        // network / transient — retry once
        apiErrored = true;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const reason: RerailMetrics["fallback_reason"] = controller.signal.aborted
    ? "timeout"
    : lastParseFailure
      ? "parse_failure"
      : apiErrored
        ? "api_error"
        : "empty";

  return {
    result: fallback,
    metrics: {
      latency_ms: Date.now() - startedAt,
      fallback_used: true,
      fallback_reason: reason,
      ...lastUsage,
    },
  };
}
