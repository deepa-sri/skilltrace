"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors as c } from "@/lib/tones";

const axis = { stroke: "#94A3B8", fontSize: 11, tickLine: false, axisLine: false };
const grid = <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />;
const tooltipProps = {
  contentStyle: { borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,.08)", fontSize: 12 },
  cursor: { fill: "rgba(37,99,235,0.06)" },
};
const legendProps = { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: 12, paddingTop: 8 } };

export const OUTCOME_COLORS = [c.green, c.amber, c.purple, c.blue, c.red];
export const REASON_COLORS = [c.blue, c.amber, c.orange, c.purple, c.teal];

function Donut({ data, dataKey, nameKey, colors, center, label, height = 220 }) {
  return (
    <div className="relative" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((entry, i) => (
              <Cell key={entry[nameKey]} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipProps} formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      {center && <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl font-bold text-slate-900">{center}</span>}
    </div>
  );
}

// Donut + value legend, used for outcome and non-placement breakdowns.
export function DonutWithLegend({ data, nameKey, valueKey = "value", colors, center, label }) {
  return (
    <div className="@container"><div className="grid grid-cols-1 items-center gap-4 @md:grid-cols-[minmax(0,200px)_1fr]">
      <Donut data={data} dataKey={valueKey} nameKey={nameKey} colors={colors} center={center} label={label} />
      <ul className="grid grid-cols-1 gap-2.5">
        {data.map((d, i) => (
          <li key={d[nameKey]} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-2.5 rounded-full" style={{ background: colors[i % colors.length] }} aria-hidden="true" />
              {d[nameKey]}
            </span>
            <span className="font-semibold text-slate-900">{d[valueKey]}%</span>
          </li>
        ))}
      </ul>
    </div></div>
  );
}

export function EmploymentDistributionChart({ data }) {
  return (
    <DonutWithLegend data={data} nameKey="name" colors={OUTCOME_COLORS} center={`${data[0].value}%`} label="Employment outcome distribution" />
  );
}

export function OutcomeTrendChart({ data, height = 280 }) {
  return (
    <div style={{ height }} role="img" aria-label="Outcome trends over the last 12 months">
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} unit="%" domain={[0, 80]} />
          <Tooltip {...tooltipProps} formatter={(v) => `${v}%`} />
          <Legend {...legendProps} />
          <Line type="monotone" dataKey="employment" name="Employment Rate" stroke={c.green} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="self" name="Self Employment" stroke={c.amber} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="apprentice" name="Apprenticeship" stroke={c.purple} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SkillGapChart({ data, height = 260 }) {
  return (
    <div style={{ height }} role="img" aria-label="Skill gap severity by district">
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barGap={2}>
          {grid}
          <XAxis dataKey="district" {...axis} interval={0} />
          <YAxis {...axis} unit="%" />
          <Tooltip {...tooltipProps} formatter={(v) => `${v}%`} />
          <Legend {...legendProps} />
          <Bar dataKey="high" name="High" fill={c.red} radius={[4, 4, 0, 0]} maxBarSize={14} />
          <Bar dataKey="medium" name="Medium" fill={c.amber} radius={[4, 4, 0, 0]} maxBarSize={14} />
          <Bar dataKey="low" name="Low" fill={c.blue} radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WageProgressionChart({ data, xKey = "stage", height = 240 }) {
  return (
    <div style={{ height }} role="img" aria-label="Average monthly wage progression">
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={c.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} tickFormatter={(v) => `₹${v / 1000}k`} width={48} />
          <Tooltip {...tooltipProps} formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Monthly wage"]} />
          <Area type="monotone" dataKey="wage" stroke={c.blue} strokeWidth={2.5} fill="url(#wageFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal bars — providers or districts ranked by a percentage metric.
export function RankedBarChart({ data, nameKey = "name", valueKey = "placement", name = "Placement rate", color = c.blue, height = 260, label }) {
  return (
    <div style={{ height }} role="img" aria-label={label ?? name}>
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...axis} unit="%" domain={[0, 100]} />
          <YAxis type="category" dataKey={nameKey} {...axis} width={120} tick={{ fill: "#475569", fontSize: 11 }} />
          <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, name]} />
          <Bar dataKey={valueKey} name={name} fill={color} radius={[0, 6, 6, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const ProviderOutcomeChart = (props) => <RankedBarChart label="Provider placement rates" {...props} />;
export const DistrictOutcomeChart = (props) => <RankedBarChart label="District placement rates" color={c.teal} {...props} />;

export function RetentionChart({ data, height = 200 }) {
  return (
    <div style={{ height }} role="img" aria-label="Job retention after placement">
      <ResponsiveContainer initialDimension={{ width: 320, height }}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
          {grid}
          <XAxis dataKey="stage" {...axis} />
          <YAxis {...axis} unit="%" domain={[0, 100]} />
          <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, "Retention"]} />
          <Bar dataKey="rate" fill={c.purple} radius={[6, 6, 0, 0]} maxBarSize={40} label={{ position: "top", fontSize: 11, fill: "#475569", formatter: (v) => `${v}%` }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
