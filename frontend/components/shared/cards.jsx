import { useId } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { toneSoft, toneSolid, toneText } from "@/lib/tones";

// Base surface matching the mockups: 16px radius, hairline border, soft shadow.
export const surface = "rounded-2xl border border-slate-200/80 bg-white shadow-card";

export function SectionCard({ title, description, action, children, className, contentClassName }) {
  return (
    <Card className={cn(surface, "gap-4 py-5", className)}>
      {(title || action) && (
        <CardHeader className="px-5">
          {title && <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn("px-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

// Icon + label + value tile (trainee dashboard).
export function StatCard({ label, value, icon, tone = "blue", highlight }) {
  return (
    <div className={cn(surface, "flex items-center gap-3 p-4")}>
      <IconTile name={icon} tone={tone} size="lg" className="max-md:hidden" />
      <div className="flex min-w-0 flex-col max-md:flex-col-reverse">
        <p className="text-xs text-muted-foreground md:truncate">{label}</p>
        <p className={cn("truncate text-2xl font-bold md:text-xl", highlight ? "text-blue-600" : "text-slate-900")}>{value}</p>
      </div>
    </div>
  );
}

// Tinted KPI card (analytics).
export function MetricCard({ label, value, change, up, tone = "blue" }) {
  const Trend = up ? TrendingUp : TrendingDown;
  return (
    <div className={cn("rounded-2xl border border-white p-4 shadow-card", toneSoft[tone])}>
      <p className="text-xs font-semibold">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tracking-tight md:text-[1.7rem]", toneText[tone])}>{value}</p>
      {change && (
        <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium", up ? "text-emerald-600" : "text-rose-500")}>
          <Trend className="size-3.5" aria-hidden="true" />
          {change}
          <span className="sr-only">{up ? "increase" : "decrease"}</span>
          <span className="text-slate-500">vs last period</span>
        </p>
      )}
    </div>
  );
}

// Labelled horizontal bar used by skill-gap lists.
export function ProgressRow({ label, value, tone = "blue", suffix = "%", icon }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="w-40 shrink-0 truncate text-sm text-slate-700 max-sm:w-28">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", toneSolid[tone])} style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-slate-700">
        {value}
        {suffix}
      </span>
    </div>
  );
}

// Circular completion indicator (profile completion).
export function ProgressRing({ value, size = 112, stroke = 10, label }) {
  const gradientId = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-xl font-bold text-slate-900">{value}%</span>
    </div>
  );
}

export function EmptyState({ title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function DemoNote({ className }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Demo data — illustrative values, not official statistics.
    </p>
  );
}
