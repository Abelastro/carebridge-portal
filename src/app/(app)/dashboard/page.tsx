import { requireSession } from "@/lib/auth/session";
import { countPatientsByStatus } from "@/lib/services/patients";

export default async function DashboardPage() {
  const { user } = await requireSession();
  const counts = await countPatientsByStatus();
  const active = counts.ACTIVE ?? 0;
  const pending = counts.PENDING_REVIEW ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Signed in as {user.name}</p>
        <h1 className="font-display text-3xl text-ink">Care overview</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <p className="text-sm text-muted">Active patients</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{active}</p>
        </section>
        <section className="panel p-5">
          <p className="text-sm text-muted">Pending review</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{pending}</p>
        </section>
      </div>
    </div>
  );
}
