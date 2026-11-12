import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

const TONES: Record<
  AppointmentStatus,
  "neutral" | "brand" | "amber" | "rose" | "sky" | "violet" | "emerald"
> = {
  PENDING: "amber",
  CONFIRMED: "sky",
  WAITING: "brand",
  IN_PROGRESS: "violet",
  COMPLETED: "emerald",
  CANCELLED: "neutral",
  NO_SHOW: "rose",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
