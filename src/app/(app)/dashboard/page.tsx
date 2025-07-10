import Link from "next/link";
import type { Metadata } from "next";
import { can } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { getDashboardStats, getRecentAuditEvents, getRecentEncounters } from "@/lib/services/dashboard";

export const metadata: Metadata = {
  title: "Overview",
};

const OUTCOME_STYLES: Record<string, string> = {
  SUCCESS: "text-brand-strong",
  DENIED: "text-danger",
  ERROR: "text-warn",
};

export default async function DashboardPage() {
  const { user } = await requireSession();
  const canReadAudit = can(user.role, "audit:read");
  const [stats, encounters, events] = await Promise.all([
    getDashboardStats(),
    getRecentEncounters(),
    canReadAudit ? getRecentAuditEvents() : Promise.resolve([]),
  ]);

  const cards = [
    { label: "Active patients", value: stats.activePatients, note: "Currently under care" },
    { label: "Pending review", value: stats.pendingReview, note: "Awaiting clinician sign-off" },
    { label: "Encounters today", value: stats.encountersToday, note: "Recorded since 00:00 UTC" },
    { label: "Notes without summary", value: stats.pendingSummaries, note: "Eligible for summarization" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Overview</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Good to see you, {user.name.split(" ")[0]}.</h1>
          <p className="mt-1 text-sm text-muted">
            A snapshot of care activity and recent access across the organization.
          </p>
        </div>
        <Link
          href="/patients"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          Open patient list
        </Link>
      </header>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{card.label}</p>
            <p className="mt-3 font-display text-3xl text-ink">{card.value}</p>
            <p className="mt-1 text-xs text-muted">{card.note}</p>
          </div>
        ))}
      </section>

      <div className={`grid gap-6 ${canReadAudit ? "xl:grid-cols-[1.55fr_1fr]" : ""}`}>
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-medium text-ink">Recent encounters</h2>
              <p className="text-xs text-muted">Latest notes across all care teams</p>
            </div>
            <Link href="/patients" className="text-xs font-medium text-brand hover:text-brand-strong">
              View patients
            </Link>
          </div>

          {encounters.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No encounters recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {encounters.map((encounter) => (
                <li key={encounter.id}>
                  <Link
                    href={`/patients/${encounter.patient.id}`}
                    className="flex flex-col gap-2 px-5 py-3.5 transition hover:bg-canvas/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {encounter.patient.firstName} {encounter.patient.lastName}
                        <span className="ml-2 font-mono text-[11px] font-normal text-muted">
                          {encounter.patient.mrn}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {encounter.clinician.name} · {formatDateTime(encounter.occurredAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                        encounter.summary
                          ? "bg-brand-soft text-brand-strong"
                          : "bg-warn-soft text-warn"
                      }`}
                    >
                      {encounter.summary ? "Summarized" : "Needs summary"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canReadAudit ? (
          <section className="panel overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-medium text-ink">Latest audit activity</h2>
            <p className="text-xs text-muted">{stats.eventsToday} events recorded today</p>
          </div>

          {events.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No audit events yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {events.map((event) => (
                <li key={event.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-mono text-[11px] text-ink">{event.action}</p>
                    <span
                      className={`text-[11px] font-medium ${OUTCOME_STYLES[event.outcome] ?? "text-muted"}`}
                    >
                      {event.outcome}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {event.actor?.name ?? "System"} · {formatDateTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line px-5 py-3">
            <Link href="/admin/audit" className="text-xs font-medium text-brand hover:text-brand-strong">
              Inspect audit chain
            </Link>
          </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
