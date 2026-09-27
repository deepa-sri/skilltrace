"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertOctagon, BadgeCheck, Bot, Briefcase, CircleDollarSign, ClipboardCheck, FilterX, GraduationCap, Lightbulb, Map, MessageSquareReply,
  Sparkles, TrendingUp, Users,
} from "lucide-react";
import { BarList, ChartCard, DISTRICT_METRICS, DistrictMap, Funnel, Legend, SERIES, axis, tooltipStyle } from "@/components/charts";
import { DemoNote, ErrorBlock, LoadingBlock, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { inr, pct } from "@/lib/utils";

const SEV = { high: "destructive", medium: "saffron", low: "secondary" };

function Filters({ f, setF, meta, districts }) {
  const any = Object.values(f).some(Boolean);
  const o = (arr, v, l, all) => [{ value: "ALL", label: all }, ...arr.map((x) => ({ value: String(x[v]), label: x[l] }))];
  const upd = (k) => (v) => setF({ ...f, [k]: v === "ALL" ? "" : v });
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Select value={f.district || "ALL"} onValueChange={upd("district")} options={o(districts, "code", "name", "All districts")} placeholder="District" />
      <Select value={f.provider || "ALL"} onValueChange={upd("provider")} options={o(meta?.providers || [], "id", "name", "All providers")} placeholder="Provider" />
      <Select value={f.programme || "ALL"} onValueChange={upd("programme")} options={o(meta?.programmes || [], "id", "name", "All programmes")} placeholder="Programme" />
      <Select value={f.sector || "ALL"} onValueChange={upd("sector")} options={o((meta?.sectors || []).map((s) => ({ s })), "s", "s", "All sectors")} placeholder="Sector" />
      <Select value={f.cohort || "ALL"} onValueChange={upd("cohort")} options={o((meta?.cohorts || []).map((s) => ({ s })), "s", "s", "All cohorts")} placeholder="Cohort year" />
      <div className="flex gap-2">
        <Select value={f.gender || "ALL"} onValueChange={upd("gender")} options={[{ value: "ALL", label: "All genders" }, { value: "F", label: "Female" }, { value: "M", label: "Male" }]} />
        {any && <Button variant="ghost" size="icon" onClick={() => setF({})} aria-label="Clear filters"><FilterX /></Button>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [f, setF] = useState({});
  const { data: d, loading, error, reload } = useApi("/admin/analytics/", f);
  const [metric, setMetric] = useState("placement_rate");
  const [insights, setInsights] = useState(null);
  const [busy, setBusy] = useState(false);

  const askInsights = async () => {
    setBusy(true);
    try { setInsights(await api("/admin/insights/", { method: "POST", body: { filters: f } })); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!d && loading) return <LoadingBlock rows={5} />;
  if (!d) return <ErrorBlock error={error} onRetry={reload} />;
  const k = d.kpis;
  const districts = d.districts;

  return (
    <>
      <PageHeader eyebrow="Department of Skills · Maharashtra" title="Skilling impact analytics"
        description="Outcomes of trainees who consented to government analytics. Groups smaller than 5 are suppressed."
        actions={<Button variant="saffron" onClick={askInsights} loading={busy}><Sparkles />Generate policy insights</Button>} />
      <div className="mb-4 space-y-3">
        <Filters f={f} setF={setF} meta={d.filters} districts={districts} />
        <DemoNote />
      </div>

      <div className={loading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Registered trainees" value={k.registered} icon={Users} hint={`${k.enrolled} enrolled`} />
          <StatCard label="Completion rate" value={k.completion_rate} suffix="%" icon={GraduationCap} hint={`dropout ${pct(k.dropout_rate)}`} format={(v) => v.toFixed(1)} delay={0.04} />
          <StatCard label="Placement rate" value={k.placement_rate} suffix="%" icon={Briefcase} tone="success" hint={`${k.placed} placed · ${k.self_employed} self-employed · ${k.apprentices} apprentices`} format={(v) => v.toFixed(1)} delay={0.08} />
          <StatCard label="Avg monthly income" value={k.avg_income} icon={CircleDollarSign} tone="saffron" format={(v) => inr(Math.round(v))} hint="placed trainees, current job" delay={0.12} />
          <StatCard label="Soft-skill pass rate" value={k.soft_pass_rate} suffix="%" icon={ClipboardCheck} hint={`${k.soft_assessed} assessed`} format={(v) => v.toFixed(1)} delay={0.16} />
          <StatCard label="Certificates issuer-verified" value={k.cert_verified_rate} suffix="%" icon={BadgeCheck} hint={`${k.certificates} submitted`} format={(v) => v.toFixed(1)} delay={0.2} />
          <StatCard label="Follow-up response" value={k.followup_response_rate} suffix="%" icon={MessageSquareReply} hint={`outcome known for ${pct(k.outcome_known_rate)} of completers`} format={(v) => v.toFixed(1)} delay={0.24} />
          <StatCard label="Retention at 180 days" value={k.retention_d180} suffix="%" icon={TrendingUp} tone="success" hint={`employer-verified ${pct(k.employer_verified_rate)}`} format={(v) => v.toFixed(1)} delay={0.28} />
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="districts"><Map />Districts</TabsTrigger>
            <TabsTrigger value="providers">Providers & programmes</TabsTrigger>
            <TabsTrigger value="skills">Skill gaps</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes & follow-up</TabsTrigger>
            <TabsTrigger value="actions"><Lightbulb />Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Trainee journey funnel" description="Each stage as a count, with conversion from the previous stage"><Funnel steps={d.funnel} /></ChartCard>
            <ChartCard title="Current outcome of completers" description="Latest reported status">
              <BarList items={d.outcomes.map((o) => ({ label: o.status, value: o.count }))} format={(v) => v.toLocaleString("en-IN")} />
            </ChartCard>
            <ChartCard title="Income progression after training" description="Average monthly income of placed trainees by months since completion">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={d.wage_progression} margin={{ top: 20, right: 16, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="period" {...axis} />
                    <YAxis {...axis} tickFormatter={(v) => `₹${v / 1000}k`} domain={["auto", "auto"]} />
                    <Tooltip {...tooltipStyle} formatter={(v, _n, p) => [`${inr(v)} (n=${p.payload.n})`, "Avg income"]} />
                    <Line dataKey="avg_income" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 5, strokeWidth: 2, fill: "hsl(var(--card))" }} activeDot={{ r: 7 }} connectNulls>
                      <LabelList dataKey="avg_income" position="top" formatter={(v) => (v ? `₹${(v / 1000).toFixed(1)}k` : "")} style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Top recommendations" description="Rule-based, from the current filter">
              <ul className="space-y-3">
                {d.recommendations.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm"><Badge variant={SEV[r.severity]} className="h-fit">{r.level}</Badge><div><div className="font-medium">{r.target}</div><div className="text-xs text-muted-foreground">{r.finding}</div></div></li>
                ))}
              </ul>
            </ChartCard>
          </TabsContent>

          <TabsContent value="districts" className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <ChartCard title="District intelligence" description="Tile map of all 36 districts, placed by approximate geography. Click a district to filter."
              action={<div className="w-44"><Select value={metric} onValueChange={setMetric} options={DISTRICT_METRICS} /></div>}>
              <DistrictMap districts={districts} metric={metric} selected={f.district} onSelect={(c) => setF({ ...f, district: c })} />
            </ChartCard>
            <Card>
              <CardHeader><CardTitle>District table</CardTitle></CardHeader>
              <CardContent className="max-h-[520px] overflow-y-auto p-0">
                <Table>
                  <THead><TR><TH>District</TH><TH className="text-right">Trainees</TH><TH className="text-right">Placed</TH><TH className="text-right">Income</TH><TH className="text-right">Follow-up</TH></TR></THead>
                  <TBody>
                    {[...districts].filter((x) => x.trainees || x.suppressed).sort((a, b) => (b.trainees || 0) - (a.trainees || 0)).map((x) => (
                      <TR key={x.code} className="cursor-pointer" onClick={() => setF({ ...f, district: x.code })}>
                        <TD className="font-medium">{x.name}</TD>
                        {x.suppressed ? <TD colSpan={4} className="text-right text-xs text-muted-foreground">suppressed (n&lt;5)</TD> : <>
                          <TD className="text-right tabular-nums">{x.trainees}</TD><TD className="text-right tabular-nums">{pct(x.placement_rate)}</TD>
                          <TD className="text-right tabular-nums">{inr(x.avg_income)}</TD><TD className="text-right tabular-nums">{pct(x.followup_rate)}</TD></>}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground"><AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />The effectiveness index weights placement (40%), assessment pass (25%), completion (20%) and certificate verification (15%). Outcomes cannot be fully attributed to a provider without a comparison baseline; use it to prioritise reviews, not to rank funding.</div>
            {[["Training providers", d.providers, "type"], ["Programmes", d.programmes, "scheme"]].map(([ttl, rows, extra]) => (
              <Card key={ttl}>
                <CardHeader><CardTitle>{ttl}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <THead><TR><TH>Name</TH><TH>{extra === "type" ? "Type" : "Scheme"}</TH><TH className="text-right">Enrolled</TH><TH className="text-right">Completion</TH><TH className="text-right">Test pass</TH><TH className="text-right">Cert verified</TH><TH className="text-right">Placement</TH><TH className="text-right">Income</TH><TH className="w-40">Effectiveness</TH></TR></THead>
                    <TBody>
                      {rows.map((r) => (
                        <TR key={r.id}>
                          <TD><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.district || r.provider}{r.small_sample && " · small sample"}</div></TD>
                          <TD className="text-xs">{r[extra]}</TD>
                          <TD className="text-right tabular-nums">{r.enrolled}</TD><TD className="text-right tabular-nums">{pct(r.completion_rate)}</TD>
                          <TD className="text-right tabular-nums">{pct(r.assessment_pass_rate)}</TD><TD className="text-right tabular-nums">{pct(r.cert_verified_rate)}</TD>
                          <TD className="text-right font-semibold tabular-nums">{pct(r.placement_rate)}</TD><TD className="text-right tabular-nums">{inr(r.avg_income)}</TD>
                          <TD><div className="flex items-center gap-2"><Progress value={r.effectiveness_index} className="h-1.5" /><span className="w-7 text-right text-xs font-semibold tabular-nums">{r.effectiveness_index}</span></div></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="skills" className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Market demand vs verified supply" description="Demo openings needing each skill vs trainees who passed its assessment" className="lg:col-span-2"
              action={<Legend items={[{ label: "Demand (demo openings)", color: SERIES[1] }, { label: "Verified trainees", color: SERIES[0] }]} />}>
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart data={d.skills.filter((s) => s.demand)} margin={{ left: -10, right: 8 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="skill" {...axis} interval={0} tick={{ ...axis.tick, fontSize: 10 }} height={50} angle={-20} textAnchor="end" />
                    <YAxis {...axis} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="demand" name="Demand" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="verified_supply" name="Verified trainees" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Average assessed score by skill" description="Best score per trainee; below 60 is under the pass mark">
              <BarList items={d.skills.filter((s) => s.avg_score != null).sort((a, b) => a.avg_score - b.avg_score).map((s) => ({ label: s.skill, value: s.avg_score, color: s.avg_score < 60 ? SERIES[1] : SERIES[0], n: s.assessed, ni: s.needs_improvement }))}
                max={100} detail={(it) => `${it.label}: avg ${it.value}/100 · ${it.n} assessed · ${it.ni} need improvement`} />
            </ChartCard>
            <ChartCard title="Soft-skill domains" description="Average domain score across all soft-skill attempts">
              <BarList items={d.soft_domains.map((s) => ({ label: s.domain, value: s.avg, color: (s.avg ?? 0) < 60 ? SERIES[1] : SERIES[0] }))} max={100} />
            </ChartCard>
            {d.weak_topics.length > 0 && (
              <ChartCard title="Weakest technical topics" description="Topics where trainees score lowest (n ≥ 5)" className="lg:col-span-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {d.weak_topics.map((w) => <div key={w.skill + w.topic} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span><b>{w.topic}</b> <span className="text-muted-foreground">in {w.skill}</span></span><span className="font-semibold tabular-nums">{w.avg}/100 <span className="text-xs font-normal text-muted-foreground">n={w.n}</span></span></div>)}
                </div>
              </ChartCard>
            )}
          </TabsContent>

          <TabsContent value="outcomes" className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Why trainees are not placed" description="Structured reasons, trainee-reported or auto-categorised">
              <BarList items={d.non_placement.map((n) => ({ label: n.category, value: n.count, iv: n.intervention }))} detail={(it) => `${it.value} trainees · suggested: ${it.iv}`} />
            </ChartCard>
            <ChartCard title="Follow-up engine by milestone">
              <Table>
                <THead><TR><TH>Milestone</TH><TH className="text-right">Scheduled</TH><TH className="text-right">Awaiting</TH><TH className="text-right">Responded</TH><TH className="text-right">Unreachable</TH></TR></THead>
                <TBody>{d.followups.map((x) => <TR key={x.milestone}><TD className="text-xs font-medium">{x.label}</TD><TD className="text-right tabular-nums">{x.scheduled}</TD><TD className="text-right tabular-nums">{x.sent}</TD><TD className="text-right font-semibold tabular-nums">{x.responded}</TD><TD className="text-right tabular-nums">{x.unreachable}</TD></TR>)}</TBody>
              </Table>
            </ChartCard>
            <ChartCard title="Certificate verification status">
              <BarList items={d.certificate_verification.map((c) => ({ label: c.status, value: c.count }))} />
            </ChartCard>
            <ChartCard title="Employment verification (placed trainees)">
              <BarList items={d.employment_verification.map((c) => ({ label: c.status, value: c.count }))} color={SERIES[2]} />
              {d.gender.length > 0 && <div className="mt-6"><div className="mb-2 text-sm font-semibold">Placement by gender</div><BarList items={d.gender.map((g) => ({ label: `${g.gender} (${g.trainees})`, value: g.placement_rate }))} max={100} format={(v) => `${v}%`} color={SERIES[2]} /></div>}
            </ChartCard>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid gap-3 md:grid-cols-2">
              {d.recommendations.map((r, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center gap-2"><Badge variant={SEV[r.severity]}>{r.severity}</Badge><Badge variant="outline">{r.level}</Badge></div>
                  <div className="mt-3 font-semibold">{r.target}</div>
                  <div className="text-sm text-muted-foreground">{r.finding}</div>
                  <div className="mt-3 rounded-lg bg-primary/5 p-3 text-sm"><span className="font-semibold text-primary">Action: </span>{r.action}</div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!insights} onOpenChange={(o) => !o && setInsights(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />Policy insights <Badge variant={insights?.source === "gemini" ? "default" : "secondary"}>{insights?.source === "gemini" ? "Gemini" : "Rule-based"}</Badge></DialogTitle>
            <DialogDescription>Generated from aggregate figures in the current view. Review before sharing.</DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-relaxed">{insights?.text}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
