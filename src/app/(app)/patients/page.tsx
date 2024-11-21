import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listPatients } from "@/lib/services/patients";
import { StatusBadge } from "@/components/status-badge";

export default async function PatientsPage() {
  await requireSession();
  const patients = await listPatients({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Patients</h1>
        <p className="text-sm text-muted">{patients.length} records in the registry</p>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">MRN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Clinician</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="table-row">
                <td className="px-4 py-3">
                  <Link href={`/patients/${patient.id}`} className="font-medium text-ink hover:text-brand">
                    {patient.lastName}, {patient.firstName}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{patient.mrn}</td>
                <td className="px-4 py-3"><StatusBadge status={patient.status} /></td>
                <td className="px-4 py-3 text-muted">{patient.primaryClinician?.name ?? "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
