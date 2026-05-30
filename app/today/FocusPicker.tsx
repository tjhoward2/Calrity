"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; content: string; status: string };

export function FocusPicker({
  pickedId,
  items,
}: {
  pickedId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picked = items.find((i) => i.id === pickedId) ?? items[0];

  function startSession(plannedMinutes: number, driftCheckAt?: number) {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          item_id: picked.id,
          planned_minutes: plannedMinutes,
          ...(driftCheckAt !== undefined ? { drift_check_at: driftCheckAt } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Could not start session.");
        return;
      }
      const { session } = await res.json();
      router.push(`/focus/${session.id}`);
    });
  }

  async function suggestFocus() {
    setAiPending(true);
    setError(null);
    try {
      const res = await fetch("/api/focus/pick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Could not suggest a focus.");
        return;
      }
      const { focus_item_id } = await res.json();
      router.replace(`/today?focus=${focus_item_id}`);
    } finally {
      setAiPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 rounded-xl p-5 bg-white">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Focus
        </p>
        <p className="text-2xl leading-snug font-medium">{picked.content}</p>
        <div className="mt-5 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => startSession(25)}
            disabled={pending}
            className="px-4 py-2 bg-[#3B6EA5] text-white rounded-md font-medium hover:bg-[#2f5a85] disabled:opacity-60"
          >
            {pending ? "Starting…" : "Start 25-min focus session"}
          </button>
          <button
            type="button"
            onClick={suggestFocus}
            disabled={aiPending}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-60"
          >
            {aiPending ? "Thinking…" : "Suggest a focus"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>

      {items.length > 1 && (
        <section>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Other open items (tap to make focus)
          </p>
          <ul className="space-y-1">
            {items
              .filter((i) => i.id !== picked.id)
              .map((it) => (
                <li key={it.id}>
                  <a
                    href={`/today?focus=${it.id}`}
                    className="block py-2 px-3 rounded-md hover:bg-neutral-50 text-neutral-700"
                  >
                    {it.content}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
