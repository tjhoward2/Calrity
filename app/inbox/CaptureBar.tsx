"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CaptureBar() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) return; // US-B1: empty submission saves nothing.

    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Could not save. Try again.");
        return;
      }
      // US-B1: input clears and stays focused (rapid serial capture).
      setValue("");
      inputRef.current?.focus();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Dump a thought…"
        maxLength={2000}
        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#3B6EA5] disabled:opacity-60"
        disabled={pending}
        aria-label="Capture a thought"
      />
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
