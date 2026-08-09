import type { DocumentStatus } from "@/types/api";

const STATUS_CLASSES: Record<DocumentStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  finalized: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}
