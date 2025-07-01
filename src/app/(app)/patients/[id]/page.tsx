import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SummaryForm } from "@/components/summary-form";
import { StatusBadge } from "@/components/status-badge";
import { can, requirePermission } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { formatAge, formatDate, formatDateTime } from "@/lib/format";
import { getPatientDetail } from "@/lib/services/patients";
import { updatePatientStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Patient record",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  requirePermission(user.role, "patient:read");

  const { id } = await params;
  const patient = await getPatientDetail(id);

  if (!patient) {
    notFound();
  }

  const canWrite = can(user.role, "patient:write");
  const canSummarize = can(user.role, "note:summarize");

  return (
    <div className="space-y-7">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/patients" className="hover:text-ink">
          Patients
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-ink">
          {patient.lastName}, {patient.firstName}
        </span>
      </nav>

      <header className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-ink">
              {patient.firstName} {patient.lastName}
            </h1>
            <StatusBadge status={patient.status} />
          </div>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">MRN</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">{patient.mrn}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Date of birth</dt>
              <dd className="mt-0.5 text-ink">
                {formatDate(patient.dateOfBirth)} ({formatAge(patient.dateOfBirth)} yrs)
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Primary clinician</dt>
              <dd className="mt-0.5 text-ink">{patient.primaryClinician?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Record added</dt>
              <dd className="mt-0.5 text-ink">{formatDate(patient.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {canWrite ? (
          <form action={updatePatientStatusAction} className="flex items-end gap-2">
            <input type="hidden" name="patientId" value={patient.id} />
            <div>
              <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted">
                Update status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={patient.status}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
            >
              Save
            </button>
          </form>
        ) : null}
      </header>

      <section aria-labelledby="encounters-heading" className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="encounters-heading" className="font-display text-2xl text-ink">
              Encounters
            </h2>
            <p className="text-sm text-muted">
              {patient.encounters.length} recorded{" "}
              {patient.encounters.length === 1 ? "encounter" : "encounters"}
            </p>
          </div>
        </div>

        {patient.encounters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center text-sm text-muted">
            No encounters recorded for this patient.
          </div>
        ) : (
          <ol className="space-y-4">
            {patient.encounters.map((encounter) => (
              <li key={encounter.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{formatDateTime(encounter.occurredAt)}</p>
                  <p className="text-xs text-muted">Recorded by {encounter.clinician.name}</p>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/90">{encounter.note}</p>

                <div className="mt-4 border-t border-line pt-4">
                  {encounter.summary ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                        AI-assisted summary
                        {encounter.summaryModel ? (
                          <span className="ml-2 font-normal normal-case tracking-normal text-muted/70">
                            {encounter.summaryModel}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-ink">{encounter.summary}</p>
                      {encounter.summarizedAt ? (
                        <p className="mt-1 text-[11px] text-muted">
                          Generated {formatDateTime(encounter.summarizedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : canSummarize ? (
                    <SummaryForm encounterId={encounter.id} note={encounter.note} />
                  ) : (
                    <p className="text-xs text-muted">No summary has been generated for this note.</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
