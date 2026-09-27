"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock, Info, ListChecks, MonitorCheck, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { cn, fmtDate } from "@/lib/utils";

function runSystemCheck() {
  const w = typeof window !== "undefined" ? window : {};
  return [
    { key: "online", label: "Internet connection", ok: navigator.onLine, required: true },
    { key: "visibility", label: "Page visibility monitoring", ok: typeof document.hidden !== "undefined", required: true },
    { key: "fullscreen", label: "Fullscreen mode", ok: !!document.fullscreenEnabled, required: false, note: "Not supported on some phones; exam still works" },
    { key: "screen", label: `Screen width ${w.innerWidth}px`, ok: w.innerWidth >= 320, required: true },
    { key: "timer", label: "Browser timers", ok: typeof w.setInterval === "function", required: true },
  ];
}

function StartDialog({ target, policy, onClose }) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState([]);
  const [identity, setIdentity] = useState(false);
  const [rules, setRules] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (target) { setStep(0); setIdentity(false); setRules(false); setTimeout(() => setChecks(runSystemCheck()), 400); }
  }, [target]);
  if (!target) return null;
  const minutes = target.kind === "SOFT" ? policy.soft_minutes : policy.tech_minutes;
  const count = target.kind === "SOFT" ? policy.soft_questions : policy.tech_questions;
  const sysOk = checks.length && checks.every((c) => c.ok || !c.required);

  const start = async () => {
    setBusy(true);
    try {
      const sys = Object.fromEntries(checks.map((c) => [c.key, c.ok]));
      const s = await api("/me/assessments/start/", { method: "POST", body: { kind: target.kind, skill_id: target.skill_id, identity_confirmed: identity, rules_accepted: rules, system_check: { ...sys, ua: navigator.userAgent.slice(0, 120) } } });
      try { await document.documentElement.requestFullscreen?.(); } catch {}
      router.push(`/trainee/assessments/${s.id}`);
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const STEPS = [t("assess.syscheck"), t("assess.rules"), "Confirm"];
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{target.title}</DialogTitle>
          <DialogDescription>{count} questions · {minutes} minutes · attempt {target.attempts_used + 1} of {policy.max_attempts}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">{STEPS.map((s, i) => <div key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />)}</div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[220px]">
            {step === 0 && (
              <div className="space-y-2">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><MonitorCheck className="h-4 w-4 text-primary" />{t("assess.syscheck")}</div>
                {!checks.length && <div className="text-sm text-muted-foreground">Checking your device…</div>}
                {checks.map((c) => (
                  <motion.div key={c.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className={cn("h-4 w-4", c.required ? "text-destructive" : "text-warning")} />}
                    <span className="flex-1">{c.label}</span>
                    {!c.ok && c.note && <span className="text-xs text-muted-foreground">{c.note}</span>}
                  </motion.div>
                ))}
              </div>
            )}
            {step === 1 && (
              <ul className="space-y-2.5 text-sm">
                {[
                  `The timer runs on the server. At ${minutes} minutes your saved answers are submitted automatically.`,
                  "Questions and options are shuffled for every attempt.",
                  "Answers save automatically. If your connection drops, you can resume within the time limit.",
                  "Leaving the tab, losing window focus, exiting fullscreen and copy attempts are recorded.",
                  "Recorded events are review signals only. A verification officer reviews flagged sessions before any decision.",
                  `You have ${policy.max_attempts} attempts. Pass mark is ${policy.pass_mark}/100.`,
                  "Need extra time or another accommodation? Ask your training provider before starting.",
                ].map((r) => <li key={r} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>)}
              </ul>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <label className="flex cursor-pointer gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={identity} onCheckedChange={(v) => setIdentity(!!v)} /><span>{t("assess.identity")}</span></label>
                <label className="flex cursor-pointer gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={rules} onCheckedChange={(v) => setRules(!!v)} /><span>{t("assess.accept")}</span></label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <DialogFooter>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>{t("common.back")}</Button>}
          {step < 2 ? <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !sysOk}>{t("common.continue")}</Button>
            : <Button onClick={start} disabled={!identity || !rules} loading={busy}>{t("assess.start")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function History({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map((h) => (
        <Link key={h.id} href={`/trainee/assessments/${h.id}`} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs hover:bg-muted">
          <span className="font-medium">Attempt {h.attempt_no}</span>
          <span className="text-muted-foreground">{fmtDate(h.submitted_at || h.started_at)}</span>
          <span className="flex-1" />
          {h.status === "IN_PROGRESS" ? <Badge variant="saffron">In progress</Badge> : <><span className="font-semibold">{h.score}/100</span><StatusBadge status={h.band} />{h.review_status !== "NONE" && <StatusBadge status={h.review_status} />}</>}
        </Link>
      ))}
    </div>
  );
}

function Assessments() {
  const { t } = useI18n();
  const { user } = useAuth();
  const params = useSearchParams();
  const { data, loading } = useApi("/me/assessments/");
  const [target, setTarget] = useState(null);

  if (loading && !data) return <LoadingBlock />;
  if (!data) return null;
  const soft = data.soft;
  const inProgSoft = soft.history.find((h) => h.status === "IN_PROGRESS");
  const highlight = Number(params.get("skill"));
  const canSoft = data.consent && !soft.passed && (inProgSoft || soft.attempts_used < data.policy.max_attempts);

  return (
    <>
      <PageHeader title={t("nav.assessments")} description="Secure, time-limited assessments. Results feed your competency profile. Certificates are verified separately." />
      {!data.consent && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-saffron/40 bg-saffron/10 p-4 text-sm">
          <Info className="h-4 w-4 text-saffron" /><span className="flex-1">Skill assessment consent is off, so assessments are disabled.</span>
          <Button asChild size="sm" variant="outline"><Link href="/trainee/consent">Review consent</Link></Button>
        </div>
      )}

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <CardHeader className="relative sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="saffron" className="mb-2">Mandatory for every trainee</Badge>
            <CardTitle className="text-lg">{t("assess.soft")}</CardTitle>
            <CardDescription className="mt-1 max-w-xl">Communication, problem-solving, teamwork, time management, professionalism, adaptability and digital literacy. Situational questions about real workplace moments.</CardDescription>
          </div>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            {soft.passed ? <Badge variant="success" className="h-8 px-3 text-sm"><CheckCircle2 />Completed</Badge> : (
              <Button disabled={!canSoft} onClick={() => inProgSoft ? (window.location.href = `/trainee/assessments/${inProgSoft.id}`) : setTarget({ kind: "SOFT", title: t("assess.soft"), attempts_used: soft.attempts_used })}>
                {inProgSoft ? t("assess.resume") : soft.attempts_used ? <><RotateCcw />{t("assess.retake")}</> : <><ClipboardCheck />{t("assess.start")}</>}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{data.policy.soft_questions} questions</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{data.policy.soft_minutes} minutes</span>
            <span>Attempts used {soft.attempts_used}/{data.policy.max_attempts}</span>
          </div>
          <History rows={soft.history} />
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">{t("assess.tech")}</h2>
      {!data.technical.length ? (
        <EmptyState icon={Sparkles} title="No skills to assess" description="Add a skill first. Each skill has its own assessment." action={<Button asChild><Link href="/trainee/skills">{t("skills.add")}</Link></Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.technical.map((s) => {
            const inProg = s.history.find((h) => h.status === "IN_PROGRESS");
            const can = data.consent && s.has_bank && (inProg || s.attempts_used < data.policy.max_attempts);
            return (
              <Card key={s.skill_id} className={cn(highlight === s.skill_id && "ring-2 ring-primary")}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{s.skill}</CardTitle>
                    <div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge status={s.status} />{s.level !== "NOT_ASSESSED" && <StatusBadge status={s.level} />}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{s.best_score ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">best score</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{s.has_bank ? `${data.policy.tech_questions} questions · ${data.policy.tech_minutes} min · ${s.attempts_used}/${data.policy.max_attempts} attempts` : "Question bank not ready for this skill"}</span>
                    <Button size="sm" variant={s.best_score == null ? "default" : "outline"} disabled={!can}
                      onClick={() => inProg ? (window.location.href = `/trainee/assessments/${inProg.id}`) : setTarget({ kind: "TECH", skill_id: s.skill_id, title: `${s.skill} assessment`, attempts_used: s.attempts_used })}>
                      {inProg ? t("assess.resume") : s.attempts_used ? t("assess.retake") : t("assess.start")}
                    </Button>
                  </div>
                  <History rows={s.history} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <StartDialog target={target} policy={data.policy} onClose={() => setTarget(null)} />
    </>
  );
}

export default function Page() {
  return <Suspense><Assessments /></Suspense>;
}
