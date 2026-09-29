import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS = {
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CircleCheck },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-600 border-rose-100", icon: CircleX },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  not_started: { label: "Not Attempted", className: "bg-rose-50 text-rose-600 border-rose-100" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-100" },
  due: { label: "Due", className: "bg-orange-50 text-orange-600 border-orange-100" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 border-blue-100" },
  sent: { label: "Sent", className: "bg-sky-50 text-sky-700 border-sky-100" },
  current: { label: "Current", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  previous: { label: "Previous", className: "bg-slate-100 text-slate-600 border-slate-200" },
  Employed: { label: "Employed", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  "Self-Employed": { label: "Self-Employed", className: "bg-violet-50 text-violet-700 border-violet-100" },
  Apprenticeship: { label: "Apprenticeship", className: "bg-teal-50 text-teal-700 border-teal-100" },
  Seeking: { label: "Seeking", className: "bg-blue-50 text-blue-700 border-blue-100" },
  "Not Employed": { label: "Not Employed", className: "bg-rose-50 text-rose-600 border-rose-100" },
};

export function StatusBadge({ status, withIcon = false, className }) {
  const config = STATUS[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  const StatusIcon = withIcon ? config.icon : null;
  return (
    <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 font-semibold", config.className, className)}>
      {StatusIcon && <StatusIcon />}
      {config.label}
    </Badge>
  );
}
