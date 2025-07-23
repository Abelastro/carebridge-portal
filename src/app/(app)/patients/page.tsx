import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { requirePermission } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { formatDate, formatAge } from "@/lib/format";
import { listPatients } from "@/lib/services/patients";
import { patientSearchSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Patients",
};

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { user } = await requireSession();
  requirePermission(user.role, "patient:read");

  const raw = await searchParams;
  const parsed = patientSearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};
  const patients = await listPatients({ query: filters.q, status: filters.status });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Directory</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Patients</h1>
        <p className="mt-1 text-sm text-muted">
          {patients.length} {patients.length === 1 ? "record" : "records"} in this view. Access is
          logged per patient record.
        </p>
      </header>

      <form method="get" className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-muted">
            Search by name or MRN
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Last name, first name, or MRN"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
        >
          Apply
        </button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          title="No patients match this view"
          description="Try a different name, MRN, or status filter."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-canvas/60 text-[11px] uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Patient</th>
                  <th scope="col" className="px-5 py-3 font-medium">MRN</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Primary clinician</th>
                  <th scope="col" className="px-5 py-3 font-medium">Encounters</th>
                  <th scope="col" className="px-5 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-ink hover:text-brand-strong"
                      >
                        {patient.lastName}, {patient.firstName}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatAge(patient.dateOfBirth)} years · DOB {formatDate(patient.dateOfBirth)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted">{patient.mrn}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {patient.primaryClinician?.name ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{patient._count.encounters}</td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatDate(patient.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
