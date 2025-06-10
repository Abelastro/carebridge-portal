"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SummaryForm({ encounterId, note }: { encounterId: string; note: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/encounters/${encounterId}/summarize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "The summary could not be generated.");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <button type="submit" disabled={pending}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-60">
        {pending ? "Generating…" : "Generate summary"}
      </button>
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}
