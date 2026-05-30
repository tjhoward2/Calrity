"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Phase =
  | "running"
  | "drift_check"
  | "rerail_loading"
  | "rerailing"
  | "completed_prompt";

type RerailResponse = {
  message: string;
  next_action: string;
  fallback_used: boolean;
  drift_event_id: string;
};

type Reason = "tab_site" | "person_message" | "thought" | "other";

const REASONS: Array<{ key: Reason; label: string }> = [
  { key: "tab_site", label: "a tab" },
  { key: "person_message", label: "a person" },
  { key: "thought", label: "a thought" },
  { key: "other", label: "other" },
];

function formatMMSS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const s = (abs % 60).toString().padStart(2, "0");
  return `${sign}${m}:${s}`;
}

export function FocusSession({
  sessionId,
  focusTask,
  plannedMinutes,
  driftCheckAt,
  startedAtIso,
}: {
  sessionId: string;
  focusTask: string;
  plannedMinutes: number;
  driftCheckAt: number;
  startedAtIso: string;
}) {
  const router = useRouter();

  const totalSeconds = plannedMinutes * 60;
  const startedAt = useRef<number>(new Date(startedAtIso).getTime());

  // remainingSeconds counts down from the planned duration; goes negative if
  // the user runs over without ending. Computed on every tick from real time.
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
    return totalSeconds - elapsed;
  });

  const [phase, setPhase] = useState<Phase>("running");
  const [rerail, setRerail] = useState<RerailResponse | null>(null);
  const [reasonPicked, setReasonPicked] = useState<Reason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const driftCheckFiredRef = useRef(false);

  // Tick the clock every second while in running phase. Drift check fires
  // automatically when we cross drift_check_at seconds elapsed.
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const remaining = totalSeconds - elapsed;
      setRemainingSeconds(remaining);

      if (!driftCheckFiredRef.current && elapsed >= driftCheckAt) {
        driftCheckFiredRef.current = true;
        setPhase("drift_check");
      }
      if (remaining <= 0 && phase === "running") {
        setPhase("completed_prompt");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, driftCheckAt, totalSeconds]);

  function resumeFromYes() {
    setPhase("running");
  }

  async function reportDrift() {
    setPhase("rerail_loading");
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/drift`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError("Could not load the re-rail. Try again.");
        setPhase("drift_check");
        return;
      }
      const data: RerailResponse = await res.json();
      setRerail(data);
      setPhase("rerailing");
    } catch {
      setError("Network hiccup. Try again.");
      setPhase("drift_check");
    }
  }

  async function backToIt() {
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionId}/return`, { method: "POST" });
      setPhase("running");
      setRerail(null);
      // Re-arm drift-check for the rest of the session (the user might drift
      // again).
      driftCheckFiredRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  async function pickDifferentFocus() {
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: "abandoned" }),
      });
      router.push("/today");
    } finally {
      setSubmitting(false);
    }
  }

  async function endSession(outcome: "completed" | "abandoned" | "drifted_back") {
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      router.push("/inbox");
    } finally {
      setSubmitting(false);
    }
  }

  async function recordReason(r: Reason) {
    if (!rerail) return;
    setReasonPicked(r);
    // RLS-scoped update directly via Supabase from the browser. No new API
    // endpoint needed — the drift_events policy already restricts to own
    // rows via auth.uid().
    const supabase = createClient();
    await supabase
      .from("drift_events")
      .update({ reason: r })
      .eq("id", rerail.drift_event_id);
  }

  // ─── render ────────────────────────────────────────────────────────────

  if (phase === "drift_check") {
    return (
      <Shell>
        <div className="space-y-5 text-center">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Quick check
          </p>
          <p className="text-xl">
            Still on <span className="font-medium">&ldquo;{focusTask}&rdquo;</span>?
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resumeFromYes}
              className="px-5 py-3 bg-[#3B6EA5] text-white rounded-md font-medium hover:bg-[#2f5a85]"
            >
              Yes, on it
            </button>
            <button
              type="button"
              onClick={reportDrift}
              className="px-5 py-3 border border-neutral-300 rounded-md font-medium hover:bg-neutral-50"
            >
              No, I drifted
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "rerail_loading") {
    return (
      <Shell>
        <div className="text-center text-neutral-500">Coming back to it…</div>
      </Shell>
    );
  }

  if (phase === "rerailing" && rerail) {
    return (
      <Shell>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              No judgment. One task.
            </p>
            <p className="text-lg leading-snug">{rerail.message}</p>
            <p className="text-sm text-neutral-700">
              <span className="text-neutral-500">Next move:</span>{" "}
              {rerail.next_action}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={backToIt}
              disabled={submitting}
              className="px-4 py-2 bg-[#3B6EA5] text-white rounded-md font-medium hover:bg-[#2f5a85] disabled:opacity-60"
            >
              Back to it
            </button>
            <button
              type="button"
              onClick={pickDifferentFocus}
              disabled={submitting}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-60"
            >
              Pick a different focus
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 mb-2">
              What pulled you away? (1 tap)
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => recordReason(r.key)}
                  disabled={reasonPicked !== null}
                  className={
                    "px-3 py-1.5 text-sm rounded-full border " +
                    (reasonPicked === r.key
                      ? "border-[#3B6EA5] bg-[#3B6EA5] text-white"
                      : reasonPicked !== null
                        ? "border-neutral-200 text-neutral-400"
                        : "border-neutral-300 hover:bg-neutral-50")
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
            {reasonPicked && (
              <p className="text-xs text-neutral-500 mt-2">Logged. Thanks.</p>
            )}
          </div>

          {rerail.fallback_used && (
            <p className="text-xs text-neutral-400">
              (using offline guidance)
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "completed_prompt") {
    return (
      <Shell>
        <div className="space-y-5 text-center">
          <p className="text-2xl">Session done.</p>
          <p className="text-sm text-neutral-500">
            How did <span className="font-medium">&ldquo;{focusTask}&rdquo;</span> go?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => endSession("completed")}
              disabled={submitting}
              className="px-4 py-2 bg-[#3F8F6B] text-white rounded-md font-medium hover:bg-[#33775a]"
            >
              ✓ Finished
            </button>
            <button
              type="button"
              onClick={() => endSession("abandoned")}
              disabled={submitting}
              className="px-4 py-2 border border-neutral-300 rounded-md font-medium hover:bg-neutral-50"
            >
              Not done yet
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // phase === "running"
  return (
    <Shell>
      <div className="text-center space-y-3">
        <p className="text-6xl font-light tabular-nums">
          {formatMMSS(remainingSeconds)}
        </p>
        <p className="text-lg text-neutral-700">{focusTask}</p>
        <p className="text-xs text-neutral-400">(low-stimulation mode)</p>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="pt-6">
          <button
            type="button"
            onClick={() => endSession("abandoned")}
            disabled={submitting}
            className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
          >
            End session
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
