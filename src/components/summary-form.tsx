"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SummaryResponse = {
  summary?: string;
  modelId?: string;
  error?: string;
};

export function SummaryForm({
  encounterId,
  note,
}: {
  encounterId: string;
  note: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/encounters/${encounterId}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const payload = (await response.json()) as SummaryResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok || !payload.summary) {
        setError(payload.error ?? "The summary could not be generated.");
        return;
      }

      setSummary(payload.summary);
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (summary) {
    return (
      <div className="rounded-lg border border-brand/20 bg-brand-soft/50 px-4 py-3" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
          Generated summary
        </p>
        <p className="mt-1.5 text-sm leading-6 text-ink">{summary}</p>
        <p className="mt-2 text-[11px] text-muted">Review before relying on this summary clinically.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="rounded-md border border-brand/25 bg-surface px-3 py-1.5 text-xs font-medium text-brand-strong transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Generating summary…" : "Generate summary"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
