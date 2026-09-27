"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, CloudOff, Eye, Lightbulb, Loader2, ShieldAlert, Target, WifiOff } from "lucide-react";
import { LoadingBlock, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn, title } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E"];

function Exam({ session, onSubmitted }) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(session.answers || {});
  const [remaining, setRemaining] = useState(session.remaining_seconds);
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const [warn, setWarn] = useState(null);
  const [counts, setCounts] = useState({ TAB_SWITCH: 0, FOCUS_LOST: 0, FULLSCREEN_EXIT: 0 });
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queue = useRef([]);
  const pendingAnswers = useRef({});
  const submitted = useRef(false);
  const qs = session.questions;
  const q = qs[idx];

  // server-synced timer
  const offset = useMemo(() => new Date(session.server_now).getTime() - Date.now(), [session.server_now]);
  useEffect(() => {
    const end = new Date(session.expires_at).getTime();
    const id = setInterval(() => setRemaining(Math.max(0, Math.round((end - (Date.now() + offset)) / 1000))), 500);
    return () => clearInterval(id);
  }, [session.expires_at, offset]);

  const push = useCallback((type, extra = {}) => {
    queue.current.push({ type, ts: new Date().toISOString(), ...extra });
    setCounts((c) => (type in c ? { ...c, [type]: c[type] + 1 } : c));
  }, []);

  const flush = useCallback(async () => {
    if (!queue.current.length || !navigator.onLine) return;
    const events = queue.current.splice(0);
    try { await api(`/me/assessments/${session.id}/events/`, { method: "POST", body: { events } }); } catch { queue.current.unshift(...events); }
  }, [session.id]);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    for (const [qid, opt] of Object.entries(pendingAnswers.current)) {
      try { await api(`/me/assessments/${session.id}/answer/`, { method: "POST", body: { question_id: Number(qid), option_index: opt } }); } catch {}
    }
    await flush();
    try {
      const res = await api(`/me/assessments/${session.id}/submit/`, { method: "POST", body: {} });
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      onSubmitted(res);
    } catch (e) {
      submitted.current = false;
      setSubmitting(false);
      toast.error(e.message);
    }
  }, [flush, onSubmitted, session.id]);

  useEffect(() => { if (remaining === 0) submit(); }, [remaining, submit]);

  // integrity listeners
  useEffect(() => {
    const onVis = () => { if (document.hidden) { push("TAB_SWITCH"); setWarn(t("assess.flag.tab")); } };
    const onBlur = () => { if (!document.hidden) push("FOCUS_LOST"); };
    const onFs = () => { if (!document.fullscreenElement && !submitted.current) { push("FULLSCREEN_EXIT"); } };
    const onCopy = (e) => { e.preventDefault(); push("COPY_ATTEMPT"); toast.warning("Copying is disabled during the assessment"); };
    const onOff = () => { setOffline(true); push("OFFLINE"); };
    const onOn = async () => {
      setOffline(false); push("ONLINE");
      for (const [qid, opt] of Object.entries(pendingAnswers.current)) {
        try { await api(`/me/assessments/${session.id}/answer/`, { method: "POST", body: { question_id: Number(qid), option_index: opt } }); delete pendingAnswers.current[qid]; } catch {}
      }
    };
    const beforeUnload = (e) => { if (!submitted.current) { e.preventDefault(); e.returnValue = ""; } };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    ["copy", "cut", "contextmenu"].forEach((ev) => document.addEventListener(ev, onCopy));
    window.addEventListener("offline", onOff);
    window.addEventListener("online", onOn);
    window.addEventListener("beforeunload", beforeUnload);
    const iv = setInterval(flush, 5000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      ["copy", "cut", "contextmenu"].forEach((ev) => document.removeEventListener(ev, onCopy));
      window.removeEventListener("offline", onOff);
      window.removeEventListener("online", onOn);
      window.removeEventListener("beforeunload", beforeUnload);
      clearInterval(iv);
      flush();
    };
  }, [flush, push, session.id, t]);

  const choose = async (opt) => {
    const key = String(q.id);
    setAnswers((a) => ({ ...a, [key]: opt }));
    pendingAnswers.current[key] = opt;
    if (!navigator.onLine) return;
    setSaving(true);
    try {
      await api(`/me/assessments/${session.id}/answer/`, { method: "POST", body: { question_id: q.id, option_index: opt } });
      delete pendingAnswers.current[key];
    } catch (e) {
      if (e.data?.code === "session_closed") submit();
    } finally {
      setSaving(false);
    }
  };

  const go = (n) => {
    if (answers[String(q.id)] == null && n > idx) push("SKIP", { question_id: q.id });
    setIdx(Math.max(0, Math.min(qs.length - 1, n)));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (confirm) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) choose(n - 1);
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const answered = qs.filter((x) => answers[String(x.id)] != null).length;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const low = remaining <= 60;
  const signals = counts.TAB_SWITCH + counts.FULLSCREEN_EXIT;

  return (
    <div className="exam-lock fixed inset-0 z-40 flex flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{session.kind === "SOFT" ? t("assess.soft") : `${session.skill} assessment`}</div>
            <div className="text-xs text-muted-foreground">{t("assess.question")} {idx + 1} {t("assess.of")} {qs.length} · {answered} answered</div>
          </div>
          {signals > 0 && <div className="hidden items-center gap-1 rounded-full bg-saffron/15 px-2.5 py-1 text-xs font-semibold text-saffron sm:flex"><Eye className="h-3.5 w-3.5" />{signals} event{signals > 1 ? "s" : ""} logged</div>}
          {offline && <div className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"><WifiOff className="h-3.5 w-3.5" />Offline</div>}
          <div className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums", low ? "animate-pulse bg-destructive/10 text-destructive" : "bg-muted")}>
            <Clock className="h-4 w-4" />{mm}:{ss}
          </div>
          <Button size="sm" onClick={() => setConfirm(true)} className="hidden sm:inline-flex">{t("assess.finish")}</Button>
        </div>
        <Progress value={(answered / qs.length) * 100} className="h-1 rounded-none" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
          <AnimatePresence mode="wait">
            <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              {q.domain && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{q.domain}</div>}
              <h2 className="text-lg font-semibold leading-relaxed sm:text-xl">{q.text}</h2>
              <div className="mt-6 grid gap-3">
                {q.options.map((o, i) => {
                  const sel = answers[String(q.id)] === i;
                  return (
                    <motion.button key={i} whileTap={{ scale: 0.99 }} onClick={() => choose(i)}
                      className={cn("flex items-start gap-3 rounded-xl border-2 bg-card p-4 text-left text-sm transition-all sm:text-base",
                        sel ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40")}>
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold", sel ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>{LETTERS[i]}</span>
                      <span className="pt-0.5">{o}</span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-3 h-4 text-xs text-muted-foreground">{saving ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving</span> : pendingAnswers.current[String(q.id)] != null ? <span className="flex items-center gap-1 text-saffron"><CloudOff className="h-3 w-3" />Will save when back online</span> : answers[String(q.id)] != null ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />Saved</span> : null}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <footer className="border-t bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
            {qs.map((x, i) => (
              <button key={x.id} onClick={() => go(i)}
                className={cn("h-8 w-8 shrink-0 rounded-lg text-xs font-semibold transition", i === idx ? "bg-foreground text-background" : answers[String(x.id)] != null ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{i + 1}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => go(idx - 1)} disabled={idx === 0}><ArrowLeft />{t("assess.prev")}</Button>
            <div className="flex-1" />
            {idx < qs.length - 1 ? <Button onClick={() => go(idx + 1)}>{t("assess.next")}<ArrowRight /></Button> : <Button onClick={() => setConfirm(true)}>{t("assess.finish")}</Button>}
          </div>
        </div>
      </footer>

      <Dialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-saffron" />Please stay on the assessment</DialogTitle>
            <DialogDescription>{warn} Events recorded so far: {counts.TAB_SWITCH} tab switches. Repeated events send the session for review by a verification officer.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => { setWarn(null); document.documentElement.requestFullscreen?.().catch(() => {}); }}>Return to assessment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your answers?</DialogTitle>
            <DialogDescription>{answered} of {qs.length} answered.{answered < qs.length && ` ${qs.length - answered} unanswered questions will be marked incorrect.`} You cannot change answers after submitting.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Keep working</Button>
            <Button onClick={submit} loading={submitting}>{t("common.submit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {submitting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur"><div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><div className="text-sm font-medium">Scoring your assessment…</div></div></div>}
    </div>
  );
}

function ScoreRing({ score, passed }) {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <motion.circle cx="64" cy="64" r={r} fill="none" stroke={passed ? "hsl(var(--primary))" : "hsl(var(--saffron))"} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * score) / 100 }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-extrabold">{score}</div>
        <div className="text-xs text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}

function Result({ s }) {
  useEffect(() => {
    if (s.passed && s.review_status === "NONE") import("canvas-confetti").then((m) => m.default({ particleCount: 120, spread: 70, origin: { y: 0.4 }, colors: ["#0f766e", "#f59e0b", "#14b8a6"] }));
  }, [s.passed, s.review_status]);
  const domains = Object.entries(s.domain_scores || {}).map(([k, v]) => ({ area: title(k), score: v }));
  const ig = s.integrity || {};
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link href="/trainee/assessments"><ArrowLeft />All assessments</Link></Button>
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 bg-gradient-to-br from-primary/10 via-transparent to-saffron/10 p-6 sm:flex-row sm:p-8">
          <ScoreRing score={s.score} passed={s.passed} />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.kind === "SOFT" ? "Soft-skill assessment" : `${s.skill} assessment`} · attempt {s.attempt_no} of {s.max_attempts}</div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{s.review_status === "FLAGGED" ? "Submitted · under review" : s.passed ? "Well done, you passed" : "Not passed yet"}</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <StatusBadge status={s.band} /><StatusBadge status={s.passed ? "PASSED" : "NEEDS_IMPROVEMENT"} />
              {s.review_status !== "NONE" && <StatusBadge status={s.review_status} />}
              {s.status === "AUTO_SUBMITTED" && <StatusBadge status="SENT" label="Auto-submitted at time limit" />}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.correct_count} of {s.total_questions} correct · pass mark {s.pass_mark} · took {Math.floor(s.duration_seconds / 60)} min {s.duration_seconds % 60} s</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{s.kind === "SOFT" ? "Domain scores" : "Topic scores"}</CardTitle></CardHeader>
          <CardContent>
            {s.kind === "SOFT" && domains.length > 2 ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <RadarChart data={domains} outerRadius="62%" margin={{ left: 24, right: 24 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-3">
                {domains.map((d) => (
                  <div key={d.area}><div className="mb-1 flex justify-between text-sm"><span>{d.area}</span><span className="font-semibold">{d.score}</span></div><Progress value={d.score} indicatorClassName={d.score < 60 ? "bg-saffron" : ""} /></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-saffron" />Feedback and next steps</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {s.feedback?.length ? s.feedback.map((f) => (
              <div key={f.area} className="rounded-xl border p-3">
                <div className="flex justify-between text-sm font-semibold"><span>{f.area}</span><span className="text-saffron">{f.score}/100</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{f.tip}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Strong performance across all areas. Keep your skills current with practice.</p>}
            <Button asChild variant="outline" size="sm"><Link href="/trainee/competency"><Target />See competency and skill gaps</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Session integrity record</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Tab switches", ig.tab_switches], ["Focus lost", ig.focus_lost], ["Fullscreen exits", ig.fullscreen_exits], ["Answer changes", ig.answer_changes], ["Skipped", ig.skips], ["Resumes", ig.resumes], ["Offline", ig.offline], ["Unanswered", ig.unanswered]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/50 p-3"><div className="text-xl font-bold">{v ?? 0}</div><div className="text-xs text-muted-foreground">{k}</div></div>
            ))}
          </div>
          {ig.flags?.length > 0 && (
            <div className="mt-4 rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-saffron" />Sent for officer review</div>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">{ig.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          {s.review_notes && <p className="mt-3 text-sm"><span className="font-semibold">Officer note:</span> {s.review_notes}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{ig.note}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AssessmentSessionPage() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api(`/me/assessments/${id}/`).then(setS).catch(setErr); }, [id]);
  if (err) return <div className="text-sm text-destructive">{err.message}</div>;
  if (!s) return <LoadingBlock />;
  if (s.status === "IN_PROGRESS") return <Exam session={s} onSubmitted={setS} />;
  return <Result s={s} />;
}
