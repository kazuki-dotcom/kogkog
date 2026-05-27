import { EmployeeStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const labels: Record<EmployeeStatus, string> = {
  PENDING: "未有効化",
  ACTIVE: "有効",
  DECEASED: "トリガー発動済み",
  REVOKED: "無効化",
};

const styles: Record<EmployeeStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  DECEASED: "bg-red-100 text-red-800",
  REVOKED: "bg-gray-100 text-gray-600",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
