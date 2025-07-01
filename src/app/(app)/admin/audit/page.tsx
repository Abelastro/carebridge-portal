import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAuditEvents, verifyAuditChain } from "@/lib/audit";
import { can } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit log",
};

const OUTCOME_STYLES: Record<string, string> = {
  SUCCESS: "bg-brand-soft text-brand-strong",
  DENIED: "bg-danger-soft text-danger",
  ERROR: "bg-warn-soft text-warn",
};

export default async function AuditPage() {
  const { user } = await requireSession();

  if (!can(user.role, "audit:read")) {
    notFound();
  }

  const [events, chain] = await Promise.all([listAuditEvents(100), verifyAuditChain(500)]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Governance</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Audit log</h1>
        <p className="mt-1 text-sm text-muted">
          Append-only events, newest first. Each entry includes the hash of the previous entry.
        </p>
      </header>

      <div
        className={`flex flex-col gap-2 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
          chain.valid
            ? "border-brand/20 bg-brand-soft/50"
            : "border-danger/25 bg-danger-soft"
        }`}
      >
        <div>
          <p className={`text-sm font-medium ${chain.valid ? "text-brand-strong" : "text-danger"}`}>
            {chain.valid ? "Chain verified" : "Chain integrity check failed"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {chain.checked} events checked
            {chain.valid
              ? " · every entry links to its predecessor"
              : ` · mismatch detected at position ${chain.brokenAt ?? "unknown"}`}
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">SHA-256 · append-only</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="bg-canvas/60 text-[11px] uppercase tracking-[0.12em] text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Timestamp</th>
                <th scope="col" className="px-5 py-3 font-medium">Actor</th>
                <th scope="col" className="px-5 py-3 font-medium">Action</th>
                <th scope="col" className="px-5 py-3 font-medium">Resource</th>
                <th scope="col" className="px-5 py-3 font-medium">Outcome</th>
                <th scope="col" className="px-5 py-3 font-medium">Source IP</th>
                <th scope="col" className="px-5 py-3 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                    {formatDateTime(event.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-ink">{event.actor?.name ?? "System"}</p>
                    <p className="text-[11px] text-muted">{event.actor?.role ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-ink">{event.action}</td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {event.resourceType}
                    {event.resourceId ? (
                      <span className="block max-w-[180px] truncate font-mono text-[10px] text-muted/70">
                        {event.resourceId}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        OUTCOME_STYLES[event.outcome] ?? "bg-canvas text-muted"
                      }`}
                    >
                      {event.outcome}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-muted">
                    {event.ipAddress ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      title={event.eventHash}
                      className="font-mono text-[10px] text-muted"
                    >
                      {event.eventHash.slice(0, 12)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No audit events recorded.</p>
        ) : null}
      </div>
    </div>
  );
}
