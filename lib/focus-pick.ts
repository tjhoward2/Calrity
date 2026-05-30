import "server-only";
import { createAnthropicClient, FOCUS_PICK_MODEL } from "./anthropic";

// Reuses the same system prompt voice. The model picks the single most
// important open item.
const SYSTEM_PROMPT = `You are the reasoning engine for an ADHD focus tool. You do three jobs: (1) pick the single most important task, (2) re-rail the user the instant they drift, and (3) at day's end, name their recurring drift triggers. Tone: firm, direct, tough-love — but NEVER cruel, NEVER shaming the person's worth, NEVER acting as a therapist or doctor.

Rules:
- Pick ONE focus from the candidates provided. The id MUST be one of the provided ids exactly.
- The one_liner is a single short sentence (≤ 90 chars) telling the user the marching order for now.
- Respond with ONLY valid JSON matching the requested schema. No prose. No markdown fences.`;

const BUDGET_MS = 4000; // PRD §11 p95 < 6s; this is light, target much lower
const MAX_OUTPUT_TOKENS = 256;

export type FocusPickInput = {
  candidates: Array<{ id: string; content: string }>;
  energyLevel?: number;
};

export type FocusPickResult = {
  focus_item_id: string;
  one_liner: string;
  fallback_used: boolean;
};

export type FocusPickMetrics = {
  latency_ms: number;
  fallback_used: boolean;
  fallback_reason?: "timeout" | "parse_failure" | "invalid_id" | "api_error" | "empty";
  input_tokens?: number;
  output_tokens?: number;
};

function tryParseFocusPickJson(
  text: string,
  validIds: Set<string>,
): { focus_item_id: string; one_liner: string } | null {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (
      typeof obj === "object" &&
      obj !== null &&
      typeof obj.focus_item_id === "string" &&
      typeof obj.one_liner === "string" &&
      validIds.has(obj.focus_item_id) &&
      obj.one_liner.trim().length > 0
    ) {
      return {
        focus_item_id: obj.focus_item_id,
        one_liner: obj.one_liner.trim().slice(0, 200),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export async function pickFocus(
  input: FocusPickInput,
): Promise<{ result: FocusPickResult | null; metrics: FocusPickMetrics }> {
  const startedAt = Date.now();

  if (input.candidates.length === 0) {
    return {
      result: null,
      metrics: { latency_ms: 0, fallback_used: true, fallback_reason: "empty" },
    };
  }

  // PRD §10.2 fallback: client lets user pick manually. We surface that as
  // result=null with fallback_used: true.
  const fallback: FocusPickResult = {
    focus_item_id: input.candidates[0].id,
    one_liner: "Pick a focus and start.",
    fallback_used: true,
  };

  const validIds = new Set(input.candidates.map((c) => c.id));
  const userMessage = JSON.stringify({
    candidates: input.candidates,
    energy_level: input.energyLevel ?? null,
    response_schema: {
      focus_item_id: "uuid of the chosen candidate",
      one_liner: "single short sentence (≤ 90 chars)",
    },
    instruction:
      "Pick the single most important item. focus_item_id MUST be one of the candidate ids verbatim. Return ONLY the JSON object — no prose, no fences.",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BUDGET_MS);
  const client = createAnthropicClient();

  let lastParseFailure = false;
  let invalidId = false;
  let apiErrored = false;
  let lastUsage: { input_tokens: number; output_tokens: number } | undefined;

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (controller.signal.aborted) break;
      try {
        const response = await client.messages.create(
          {
            model: FOCUS_PICK_MODEL,
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

        // Distinguish parse failure from "valid JSON, wrong id"
        let raw: unknown;
        try {
          const cleaned = textBlock.text
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          raw = JSON.parse(cleaned);
        } catch {
          lastParseFailure = true;
          continue;
        }

        const parsed = tryParseFocusPickJson(textBlock.text, validIds);
        if (!parsed) {
          if (raw && typeof raw === "object" && "focus_item_id" in raw) {
            invalidId = true;
          } else {
            lastParseFailure = true;
          }
          continue;
        }

        return {
          result: { ...parsed, fallback_used: false },
          metrics: {
            latency_ms: Date.now() - startedAt,
            fallback_used: false,
            ...lastUsage,
          },
        };
      } catch {
        if (controller.signal.aborted) break;
        apiErrored = true;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const reason: FocusPickMetrics["fallback_reason"] = controller.signal.aborted
    ? "timeout"
    : invalidId
      ? "invalid_id"
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
