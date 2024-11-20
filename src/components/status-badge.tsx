import type { PatientStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/format";

const STYLES: Record<PatientStatus, string> = {
  ACTIVE: "border-brand/20 bg-brand-soft text-brand-strong",
  DISCHARGED: "border-line bg-canvas text-muted",
  PENDING_REVIEW: "border-warn/20 bg-warn-soft text-warn",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
