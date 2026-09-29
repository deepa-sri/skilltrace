"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoNote, MetricCard, ProgressRow, SectionCard } from "@/components/shared/cards";
import { PageHeader } from "@/components/shared/page-header";
import {
  DistrictOutcomeChart,
  EmploymentDistributionChart,
  OutcomeTrendChart,
  ProviderOutcomeChart,
  RetentionChart,
  WageProgressionChart,
} from "@/components/charts/charts";
import { analytics, skillGaps } from "@/lib/mock-data";

const PERIOD_MONTHS = { "Last 3 Months": 3, "Last 6 Months": 6, "Last 12 Months": 12 };
const ALL = "all";

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState("Last 12 Months");
  const [district, setDistrict] = useState(ALL);

  const trends = analytics.trends.slice(-PERIOD_MONTHS[period]);
  const districtRows = district === ALL ? analytics.districts : analytics.districts.filter((d) => d.name === district);
  const kpis = analytics.kpis.map((k) =>
    k.label === "Employment Rate" && district !== ALL ? { ...k, value: `${districtRows[0].placement}%`, change: null } : k
  );

  const filters = (
    <>
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger aria-label="Period" className="!h-10 w-full rounded-xl bg-white md:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {analytics.periods.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={district} onValueChange={setDistrict}>
        <SelectTrigger aria-label="District" className="!h-10 w-full rounded-xl bg-white md:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Maharashtra (All Districts)</SelectItem>
          {analytics.districts.map((d) => (
            <SelectItem key={d.name} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Skilling Outcomes Dashboard" description="Real-time insights across Maharashtra" actions={filters} />

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.label} className={i === 0 ? "max-lg:col-span-2" : undefined}>
            <MetricCard {...k} />
          </div>
        ))}
      </section>

      <Tabs defaultValue="outcomes" className="gap-5">
        <TabsList className="scrollbar-none h-11 w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1 md:w-fit">
          {[
            ["outcomes", "Outcomes"],
            ["providers", "Providers"],
            ["districts", "Districts"],
            ["skills", "Skill Gaps"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="flex-none rounded-lg px-4 data-[state=active]:text-blue-600">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="outcomes" className="grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.35fr]">
            <SectionCard title="Employment Outcomes">
              <EmploymentDistributionChart data={analytics.outcomes} />
            </SectionCard>
            <SectionCard title={`Outcome Trends (${period})`}>
              <OutcomeTrendChart data={trends} />
            </SectionCard>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SectionCard title="Wage Progression" description="Average monthly wage after placement">
              <WageProgressionChart data={analytics.wageProgression} />
            </SectionCard>
            <SectionCard title="Job Retention" description="Share still employed after placement">
              <RetentionChart data={analytics.retention} height={240} />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title="Provider Placement Rate">
            <ProviderOutcomeChart data={analytics.providers} height={280} />
          </SectionCard>
          <SectionCard title="Provider Outcomes" contentClassName="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Provider</TableHead>
                  <TableHead className="text-right">Trainees</TableHead>
                  <TableHead className="text-right">Placement</TableHead>
                  <TableHead className="pr-5 text-right">Retention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.providers.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="pl-5 font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.trainees.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{p.placement}%</TableCell>
                    <TableCell className="pr-5 text-right">{p.retention}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="districts" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title={district === ALL ? "District Placement Rate" : `${district} Placement Rate`}>
            <DistrictOutcomeChart data={districtRows} height={districtRows.length > 1 ? 280 : 90} />
          </SectionCard>
          <SectionCard title="District Summary" contentClassName="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">District</TableHead>
                  <TableHead className="text-right">Trainees</TableHead>
                  <TableHead className="pr-5 text-right">Placement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districtRows.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="pl-5 font-medium">{d.name}</TableCell>
                    <TableCell className="text-right">{d.trainees.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="pr-5 text-right">{d.placement}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="skills">
          <SectionCard
            title="Top Skill Gaps"
            action={
              <Button asChild variant="ghost" size="sm" className="text-blue-600">
                <Link href="/skill-gaps">
                  Full analysis <ArrowRight />
                </Link>
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-10">
              {skillGaps.top.map((g) => (
                <ProgressRow key={g.skill} label={g.skill} value={g.gap} tone={g.tone} />
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
      <DemoNote />
    </div>
  );
}
