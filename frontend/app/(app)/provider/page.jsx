"use client";
import { Briefcase, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { BarList, ChartCard, Funnel, SERIES } from "@/components/charts";
import { DemoNote, LoadingBlock, PageHeader, StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useApi } from "@/lib/use-api";
import { inr, pct } from "@/lib/utils";

export default function ProviderHome() {
  const { data: d, loading } = useApi("/provider/analytics/");
  if (loading && !d) return <LoadingBlock rows={4} />;
  if (!d) return null;
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow={`${d.provider.type_label} · ${d.provider.district_name}`} title={d.provider.name} description="Outcomes of your trainees who consented to analytics." />
      <DemoNote className="mb-4" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trainees" value={k.registered} icon={Users} />
        <StatCard label="Completion rate" value={k.completion_rate} suffix="%" icon={GraduationCap} format={(v) => v.toFixed(1)} delay={0.05} />
        <StatCard label="Soft-skill pass" value={k.soft_pass_rate} suffix="%" icon={ClipboardCheck} format={(v) => v.toFixed(1)} delay={0.1} />
        <StatCard label="Placement rate" value={k.placement_rate} suffix="%" icon={Briefcase} tone="success" hint={`avg ${inr(k.avg_income)}`} format={(v) => v.toFixed(1)} delay={0.15} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Trainee funnel"><Funnel steps={d.funnel} /></ChartCard>
        <ChartCard title="Why your trainees are not placed"><BarList items={d.non_placement.map((n) => ({ label: n.category, value: n.count, iv: n.intervention }))} detail={(it) => `${it.value} · ${it.iv}`} color={SERIES[1]} /></ChartCard>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Programme scorecard</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead><TR><TH>Programme</TH><TH className="text-right">Enrolled</TH><TH className="text-right">Completion</TH><TH className="text-right">Test pass</TH><TH className="text-right">Placement</TH><TH className="text-right">Income</TH><TH className="w-40">Index</TH></TR></THead>
              <TBody>{d.programmes.map((p) => (
                <TR key={p.id}><TD><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.code} · {p.scheme}</div></TD>
                  <TD className="text-right">{p.enrolled}</TD><TD className="text-right">{pct(p.completion_rate)}</TD><TD className="text-right">{pct(p.assessment_pass_rate)}</TD>
                  <TD className="text-right font-semibold">{pct(p.placement_rate)}</TD><TD className="text-right">{inr(p.avg_income)}</TD>
                  <TD><div className="flex items-center gap-2"><Progress value={p.effectiveness_index} className="h-1.5" /><span className="text-xs font-semibold">{p.effectiveness_index}</span></div></TD></TR>
              ))}</TBody>
            </Table>
          </CardContent>
        </Card>
        <ChartCard title="Assessed skill scores" description="Average best score of your trainees; below 60 needs curriculum attention">
          <BarList items={d.skills.filter((s) => s.avg_score != null).map((s) => ({ label: s.skill, value: s.avg_score, color: s.avg_score < 60 ? SERIES[1] : SERIES[0] }))} max={100} />
        </ChartCard>
        <ChartCard title="Recommendations">
          <ul className="space-y-3 text-sm">{d.recommendations.map((r, i) => <li key={i}><div className="font-medium">{r.target}</div><div className="text-xs text-muted-foreground">{r.finding}</div><div className="text-xs text-primary">{r.action}</div></li>)}</ul>
        </ChartCard>
      </div>
    </>
  );
}
