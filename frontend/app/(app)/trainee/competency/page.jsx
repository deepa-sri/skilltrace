"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, CircleAlert, ClipboardCheck, FileCheck2, Target, Wand2 } from "lucide-react";
import { LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { title } from "@/lib/utils";

function Gauge({ value }) {
  const r = 70, c = Math.PI * r;
  return (
    <div className="relative mx-auto h-28 w-48">
      <svg viewBox="0 0 180 100" className="h-full w-full">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        <motion.path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * value) / 100 }} transition={{ duration: 1.1 }} />
        <defs><linearGradient id="gg"><stop offset="0" stopColor="hsl(var(--saffron))" /><stop offset="1" stopColor="hsl(var(--primary))" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center"><div className="text-3xl font-extrabold">{value}%</div><div className="text-xs text-muted-foreground">role readiness</div></div>
    </div>
  );
}

export default function CompetencyPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const comp = useApi("/me/competency/");
  const roles = useApi("/roles/");
  const [role, setRole] = useState(user.profile?.target_role ? String(user.profile.target_role) : "");
  const [gap, setGap] = useState(null);
  const [loadingGap, setLoadingGap] = useState(false);

  useEffect(() => {
    if (!role) return;
    setLoadingGap(true);
    api("/me/skill-gap/", { params: { role } }).then(setGap).catch(() => setGap(null)).finally(() => setLoadingGap(false));
  }, [role]);

  if (comp.loading && !comp.data) return <LoadingBlock />;
  const c = comp.data;
  return (
    <>
      <PageHeader title={t("nav.competency")} description={c?.note} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />Soft-skill profile</CardTitle></CardHeader>
          <CardContent>
            {c?.soft_skill.completed ? (
              <>
                <div className="mb-4 flex items-end gap-3"><div className="text-4xl font-extrabold">{c.soft_skill.score}</div><div className="pb-1 text-sm text-muted-foreground">/100</div><StatusBadge status={c.soft_skill.band} className="mb-1.5" />{c.soft_skill.review_status === "FLAGGED" && <StatusBadge status="FLAGGED" className="mb-1.5" />}</div>
                <div className="space-y-2.5">
                  {Object.entries(c.soft_skill.domains).map(([k, v]) => (
                    <div key={k}><div className="mb-1 flex justify-between text-xs"><span>{title(k)}</span><span className="font-semibold">{v}</span></div><Progress value={v} indicatorClassName={v < 60 ? "bg-saffron" : ""} /></div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm">
                <CircleAlert className="mx-auto mb-2 h-6 w-6 text-saffron" />The mandatory soft-skill assessment is not completed yet.
                <div className="mt-3"><Button asChild size="sm"><Link href="/trainee/assessments">{t("assess.start")}</Link></Button></div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Technical competency</CardTitle><CardDescription>Certificate evidence and demonstrated performance are recorded independently.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead><TR><TH>Skill</TH><TH><FileCheck2 className="inline h-3.5 w-3.5" /> Certificate</TH><TH>Score</TH><TH>Level</TH><TH>State</TH></TR></THead>
              <TBody>
                {c?.skills.map((s) => (
                  <TR key={s.skill}>
                    <TD className="font-medium">{s.skill}<div className="text-[11px] font-normal text-muted-foreground">{s.source}</div></TD>
                    <TD>{s.certificate_status ? <StatusBadge status={s.certificate_status} /> : <span className="text-xs text-muted-foreground">None linked</span>}</TD>
                    <TD className="font-semibold">{s.score ?? "—"}</TD>
                    <TD>{s.level !== "NOT_ASSESSED" ? <StatusBadge status={s.level} /> : "—"}</TD>
                    <TD><Badge variant={s.state === "Verified competency" ? "success" : s.state === "Under review" ? "saffron" : "secondary"}>{s.state}</Badge></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Skill-gap intelligence</CardTitle><CardDescription>Compare your demonstrated competency with a target role.</CardDescription></div>
          <div className="sm:w-72"><Select value={role} onValueChange={setRole} placeholder="Choose a target role" options={(roles.data || []).map((r) => ({ value: String(r.id), label: `${r.name} · ${r.sector}` }))} /></div>
        </CardHeader>
        <CardContent>
          {!role ? <p className="text-sm text-muted-foreground">Pick a role to see which skills you already meet and what to build next.</p> : loadingGap || !gap ? <LoadingBlock rows={2} /> : (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <div className="space-y-4">
                <Gauge value={gap.readiness} />
                <div className="space-y-2">
                  {gap.met.map((m) => <div key={m.skill} className="flex items-start gap-2 rounded-lg bg-success/10 p-2.5 text-xs"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /><div><div className="font-semibold">{m.skill}</div><div className="text-muted-foreground">{m.evidence}</div></div></div>)}
                </div>
              </div>
              <div className="space-y-4">
                {gap.gaps.map((g) => (
                  <div key={g.skill} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{g.skill}</span><StatusBadge status={g.current === "NOT_ASSESSED" ? "NOT_ASSESSED" : g.current} /><span className="text-xs text-muted-foreground">→ needs</span><StatusBadge status={g.required} /></div>
                    <p className="mt-1.5 text-sm text-muted-foreground"><span className="font-medium text-foreground">Why: </span>{g.evidence}</p>
                  </div>
                ))}
                {gap.soft_gap && <div className="rounded-xl border p-4"><div className="font-semibold">Soft skills</div><p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Why: </span>{gap.soft_gap.evidence}{gap.soft_gap.weak_domains?.length ? ` · weaker in ${gap.soft_gap.weak_domains.map(title).join(", ")}` : ""}</p></div>}
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-saffron/10 p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /><span className="font-semibold">Personalised improvement plan</span>
                    <Badge variant={gap.plan_source === "gemini" ? "default" : "secondary"}><Bot />{gap.plan_source === "gemini" ? "Gemini" : "Rule-based"}</Badge>
                  </div>
                  <ol className="space-y-4">
                    {gap.plan.map((p, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                        <div><div className="text-sm font-semibold">{p.title}</div>{p.why && <div className="text-xs text-muted-foreground">{p.why}</div>}
                          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm">{(p.steps || []).map((s) => <li key={s}>{s}</li>)}</ul></div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex gap-2"><Button asChild size="sm"><Link href="/trainee/assessments">Reassess</Link></Button><Button asChild size="sm" variant="outline"><Link href="/trainee/skills">Add skills</Link></Button></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
