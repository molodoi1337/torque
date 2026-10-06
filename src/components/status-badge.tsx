import { STATUS_INFO } from "@/lib/constants";
import type { Status } from "@/db/schema";

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_INFO[status];
  return (
    <span className={`badge ${s.color}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
