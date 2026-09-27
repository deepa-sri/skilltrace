"use client";
import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";
import { AlertTriangle, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString("en-IN"), className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (value == null || !ref.current) return;
    const controls = animate(0, Number(value), {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={className}>{value == null ? "—" : format(0)}</span>;
}

export function StatCard({ label, value, suffix, icon: Icon, hint, tone = "primary", format, delay = 0 }) {
  const tones = {
    primary: "from-primary/15 text-primary",
    saffron: "from-saffron/20 text-[hsl(28_85%_40%)] dark:text-saffron",
    success: "from-success/15 text-success",
    destructive: "from-destructive/15 text-destructive",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Card className="relative h-full overflow-hidden p-4 sm:p-5">
        <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-xl", tones[tone])} />
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</div>
          {Icon && <div className={cn("rounded-lg bg-gradient-to-br to-transparent p-1.5", tones[tone])}><Icon className="h-4 w-4" /></div>}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {value == null ? "—" : <AnimatedNumber value={value} format={format} />}
          {value != null && suffix && <span className="ml-0.5 text-base font-semibold text-muted-foreground">{suffix}</span>}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </Card>
    </motion.div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      <div className="mb-3 rounded-2xl bg-muted p-3"><Icon className="h-6 w-6 text-muted-foreground" /></div>
      <div className="font-semibold">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1">{error.message}</div>
      {onRetry && <button onClick={onRetry} className="font-semibold text-primary">Retry</button>}
    </div>
  );
}

const STATUS = {
  // certificates
  PENDING: ["secondary", "Pending"], DOCUMENT_CHECKED: ["secondary", "Document checked"], ISSUER_VERIFIED: ["success", "Issuer verified"],
  PARTIALLY_VERIFIED: ["warning", "Partially verified"], MANUAL_REVIEW: ["saffron", "Manual review"], REJECTED: ["destructive", "Rejected"],
  VERIFICATION_UNAVAILABLE: ["secondary", "Verification unavailable"],
  // skills
  NOT_ASSESSED: ["secondary", "Not assessed"], PASSED: ["success", "Passed"], NEEDS_IMPROVEMENT: ["warning", "Needs improvement"], UNDER_REVIEW: ["saffron", "Under review"],
  // employment verification
  SELF_REPORTED: ["secondary", "Self-reported"], REQUESTED: ["saffron", "Verification requested"], CONFIRMED: ["success", "Employer confirmed"],
  DISPUTED: ["warning", "Disputed"], UNABLE: ["secondary", "Unable to verify"],
  // enrollment
  ENROLLED: ["secondary", "Enrolled"], IN_PROGRESS: ["default", "In progress"], COMPLETED: ["success", "Completed"], DROPOUT: ["destructive", "Dropped out"],
  // follow-ups
  SCHEDULED: ["secondary", "Scheduled"], SENT: ["saffron", "Awaiting reply"], RESPONDED: ["success", "Responded"], UNREACHABLE: ["destructive", "Unreachable"],
  // review
  FLAGGED: ["saffron", "Flagged"], CLEARED: ["success", "Cleared"], INVALIDATED: ["destructive", "Invalidated"], NONE: ["secondary", "No review"],
  // levels
  BEGINNER: ["destructive", "Beginner"], BASIC: ["warning", "Basic"], INTERMEDIATE: ["default", "Intermediate"], ADVANCED: ["success", "Advanced"],
  // employment status
  EMPLOYED: ["success", "Employed"], SELF_EMPLOYED: ["success", "Self-employed"], APPRENTICE: ["default", "Apprentice"], SEEKING: ["warning", "Seeking employment"],
  HIGHER_EDUCATION: ["secondary", "Higher education"], CONTINUING_TRAINING: ["secondary", "Continuing training"], OTHER: ["secondary", "Other"],
};

export function StatusBadge({ status, label, className }) {
  const [variant, text] = STATUS[status] || ["secondary", status];
  return <Badge variant={variant} className={className}>{label || text}</Badge>;
}

export function DemoNote({ className, children }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-xl border border-saffron/30 bg-saffron/5 px-3 py-2 text-xs text-muted-foreground", className)}>
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
      <span>{children || "Figures shown are generated from fictional demo records, not government statistics."}</span>
    </div>
  );
}

export function Aurora({ className }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute -left-32 -top-40 h-[480px] w-[480px] animate-aurora rounded-full bg-primary/25 blur-[110px]" />
      <div className="absolute -right-24 top-10 h-[420px] w-[420px] animate-aurora rounded-full bg-saffron/20 blur-[110px] [animation-delay:-5s]" />
      <div className="absolute bottom-[-200px] left-1/3 h-[420px] w-[520px] animate-aurora rounded-full bg-emerald-400/15 blur-[120px] [animation-delay:-9s]" />
      <div className="absolute inset-0 bg-grid mask-fade opacity-60" />
    </div>
  );
}
