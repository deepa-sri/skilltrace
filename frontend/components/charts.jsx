"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tip } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/** Categorical slots in fixed order (validated light + dark via CSS vars). */
export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)"];

export const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12, boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)" },
  labelStyle: { fontWeight: 600, color: "hsl(var(--foreground))" },
  itemStyle: { color: "hsl(var(--foreground))" },
  cursor: { fill: "hsl(var(--muted))", opacity: 0.5 },
};
export const axis = { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false };

export function ChartCard({ title, description, children, action, className }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div><CardTitle>{title}</CardTitle>{description && <CardDescription className="mt-1">{description}</CardDescription>}</div>
        {action}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

/** Horizontal bar list: label, bar, value. Hover shows a tooltip with the detail. */
export function BarList({ items, max, format = (v) => v, color = SERIES[0], valueKey = "value", labelKey = "label", detail }) {
  const top = max ?? Math.max(1, ...items.map((i) => i[valueKey] || 0));
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <Tip key={it[labelKey] + i} content={detail ? detail(it) : `${it[labelKey]}: ${format(it[valueKey])}`}>
          <li className="group grid cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <span className="truncate text-sm">{it[labelKey]}</span>
            <span className="text-sm font-semibold tabular-nums">{it[valueKey] == null ? "—" : format(it[valueKey])}</span>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full group-hover:opacity-80" style={{ background: it.color || color }}
                initial={{ width: 0 }} animate={{ width: `${((it[valueKey] || 0) / top) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.04 }} />
            </div>
          </li>
        </Tip>
      ))}
    </ul>
  );
}

export function Funnel({ steps }) {
  const top = steps[0]?.count || 1;
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const w = (s.count / top) * 100;
        const conv = i > 0 && steps[i - 1].count ? Math.round((s.count / steps[i - 1].count) * 100) : null;
        return (
          <Tip key={s.stage} content={`${s.stage}: ${s.count.toLocaleString("en-IN")}${conv != null ? ` (${conv}% of previous stage)` : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs text-muted-foreground sm:w-40 sm:text-sm">{s.stage}</div>
              <div className="relative h-8 flex-1">
                <motion.div className="absolute inset-y-0 left-0 flex items-center rounded-lg px-2.5 text-xs font-bold text-white"
                  style={{ background: `hsl(173 ${70 - i * 4}% ${26 + i * 5}%)` }}
                  initial={{ width: 0 }} animate={{ width: `${Math.max(w, 8)}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}>
                  {s.count.toLocaleString("en-IN")}
                </motion.div>
              </div>
              <div className="w-10 text-right text-xs text-muted-foreground">{conv != null ? `${conv}%` : ""}</div>
            </div>
          </Tip>
        );
      })}
    </div>
  );
}

const METRICS = {
  placement_rate: { label: "Placement rate", fmt: (v) => `${v}%` },
  trainees: { label: "Trainees", fmt: (v) => v },
  avg_income: { label: "Avg income", fmt: (v) => `₹${(v / 1000).toFixed(1)}k` },
  followup_rate: { label: "Follow-up response", fmt: (v) => `${v}%` },
  soft_pass_rate: { label: "Soft-skill pass", fmt: (v) => `${v}%` },
};

/** Single-hue sequential tile map of Maharashtra's 36 districts (approximate geography). */
export function DistrictMap({ districts, metric = "placement_rate", onSelect, selected }) {
  const vals = districts.map((d) => d[metric]).filter((v) => v != null);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const shade = (v) => {
    if (v == null) return null;
    const t = hi === lo ? 0.6 : (v - lo) / (hi - lo);
    return `hsl(173 ${45 + t * 35}% ${88 - t * 60}%)`;
  };
  const cols = 10, rows = 6;
  return (
    <div>
      <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` }}>
        {districts.map((d) => {
          const v = d[metric];
          const bg = shade(v);
          const dark = v != null && (hi === lo ? 0.6 : (v - lo) / (hi - lo)) > 0.45;
          return (
            <Tip key={d.code} content={<span><b>{d.name}</b> · {d.division}<br />{d.suppressed ? "Fewer than 5 trainees: suppressed" : v == null ? "No data" : `${METRICS[metric].label}: ${METRICS[metric].fmt(v)}`}{d.trainees != null && metric !== "trainees" ? ` · ${d.trainees} trainees` : ""}</span>}>
              <button onClick={() => onSelect?.(d.code === selected ? "" : d.code)} style={{ gridColumn: d.col + 1, gridRow: d.row + 1, background: bg || undefined }}
                className={cn("flex aspect-square flex-col items-center justify-center rounded-md border text-center transition hover:scale-105 sm:rounded-lg",
                  !bg && (d.suppressed ? "bg-[repeating-linear-gradient(45deg,hsl(var(--muted)),hsl(var(--muted))_4px,transparent_4px,transparent_8px)]" : "bg-muted/40"),
                  selected === d.code && "ring-2 ring-saffron ring-offset-2 ring-offset-card", dark ? "border-transparent text-white" : "text-foreground")}>
                <span className="text-[8px] font-bold leading-none sm:text-[10px]">{d.code}</span>
                <span className="mt-0.5 hidden text-[10px] font-semibold tabular-nums sm:block">{v == null ? "" : METRICS[metric].fmt(v)}</span>
              </button>
            </Tip>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{vals.length ? METRICS[metric].fmt(lo) : ""}</span>
        <div className="h-2 w-40 rounded-full" style={{ background: "linear-gradient(90deg, hsl(173 45% 88%), hsl(173 80% 28%))" }} />
        <span>{vals.length ? METRICS[metric].fmt(hi) : ""}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted/40 ring-1 ring-border" />no data</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-[repeating-linear-gradient(45deg,hsl(var(--muted)),hsl(var(--muted))_2px,transparent_2px,transparent_4px)] ring-1 ring-border" />suppressed (n&lt;5)</span>
      </div>
    </div>
  );
}
export const DISTRICT_METRICS = Object.entries(METRICS).map(([value, m]) => ({ value, label: m.label }));

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map((it) => <span key={it.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />{it.label}</span>)}
    </div>
  );
}
