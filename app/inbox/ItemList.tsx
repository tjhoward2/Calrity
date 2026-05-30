"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export type ItemStatus = "inbox" | "active" | "done" | "parked";

export type Item = {
  id: string;
  content: string;
  status: ItemStatus;
  created_at: string;
  completed_at: string | null;
};

// PRD §6.6 wireframe order: inbox → active → done → parked.
const GROUPS: { status: ItemStatus; label: string }[] = [
  { status: "inbox", label: "Inbox" },
  { status: "active", label: "Active" },
  { status: "done", label: "Done" },
  { status: "parked", label: "Parked" },
];

export function ItemList({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function patch(id: string, body: Record<string, unknown>) {
    startTransition(async () => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
    });
  }

  if (initialItems.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center">
        Nothing here yet. Type in the box above to capture a thought.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {GROUPS.map(({ status, label }) => {
        // US-B2: newest first within each group (initialItems is already
        // ordered created_at DESC server-side).
        const items = initialItems.filter((i) => i.status === status);
        if (items.length === 0) return null;
        return (
          <section key={status} aria-labelledby={`group-${status}`}>
            <h2
              id={`group-${status}`}
              className="text-xs uppercase tracking-wide text-neutral-500 mb-2"
            >
              {label}
            </h2>
            <ul className="space-y-1">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-md hover:bg-neutral-50 group"
                >
                  <span
                    className={
                      it.status === "done"
                        ? "line-through text-neutral-500"
                        : ""
                    }
                  >
                    {it.content}
                  </span>
                  <div className="flex gap-3 text-xs text-neutral-500 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {it.status !== "active" && it.status !== "done" && (
                      <button
                        onClick={() => patch(it.id, { status: "active" })}
                        disabled={pending}
                        className="hover:text-[#3B6EA5]"
                      >
                        activate
                      </button>
                    )}
                    {it.status !== "done" && (
                      <button
                        onClick={() => patch(it.id, { status: "done" })}
                        disabled={pending}
                        className="hover:text-[#3F8F6B]"
                      >
                        ✓ done
                      </button>
                    )}
                    {it.status !== "parked" && it.status !== "done" && (
                      <button
                        onClick={() => patch(it.id, { status: "parked" })}
                        disabled={pending}
                        className="hover:text-neutral-700"
                      >
                        park
                      </button>
                    )}
                    {(it.status === "done" || it.status === "parked") && (
                      <button
                        onClick={() => patch(it.id, { status: "inbox" })}
                        disabled={pending}
                        className="hover:text-neutral-700"
                      >
                        reopen
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
