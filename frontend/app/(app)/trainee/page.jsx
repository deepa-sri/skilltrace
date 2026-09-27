"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BellRing, Briefcase, ClipboardCheck, FileCheck2, IdCard, Sparkles } from "lucide-react";
import { ErrorBlock, LoadingBlock, StatCard, StatusBadge } from "@/components/common";
import { JourneyStepper, STEP_META } from "@/components/journey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const NEXT_COPY = {
  consent: "Review your consent choices so we can store your training record.",
  training: "Enroll in a training programme or ask your provider to add you with your UTI.",
  certificate: "Submit a training certificate so it can be verified with the issuer.",
  skills: "Add the skills you have. They stay unverified until you are assessed.",
  soft: "Take the mandatory soft-skill assessment. It takes about 15 minutes.",
  technical: "Take a technical assessment for one of your skills to verify your competency.",
  gap: "Pick a target job role and see which skills to build next.",
  employment: "Tell us your current work status. This helps measure programme impact.",
  followup: "Answer your pending follow-up. It takes one minute.",
};

export default function TraineeHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const journey = useApi("/me/journey/");
  const comp = useApi("/me/competency/");
  const fus = useApi("/me/followups/");
  const tl = useApi("/me/timeline/");

  if (journey.loading && !journey.data) return <LoadingBlock rows={4} />;
  const steps = journey.data?.steps || [];
  const openFollowups = (fus.data || []).filter((f) => f.can_respond);
  const next = openFollowups.length ? { key: "followup" } : steps.find((s) => !s.done);
  const c = comp.data;
  const verifiedSkills = c?.skills.filter((s) => s.state === "Verified competency").length ?? null;

  return (
    <div className="space-y-6">
      <ErrorBlock error={journey.error} onRetry={journey.reload} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[hsl(180_65%_24%)] to-[hsl(200_60%_18%)] p-6 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-saffron/30 blur-3xl" />
          <div className="relative">
            <div className="text-sm opacity-80">{t("trainee.welcome")},</div>
            <div className="text-2xl font-bold sm:text-3xl">{user.full_name}</div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
              <IdCard className="h-4 w-4" /><span className="text-xs opacity-80">{t("trainee.uti")}</span>
              <span className="font-mono text-sm font-bold tracking-wide">{user.profile?.uti}</span>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs opacity-90"><span>{t("trainee.journey")}</span><span>{journey.data?.progress}%</span></div>
              <Progress value={journey.data?.progress} className="bg-white/20" indicatorClassName="bg-saffron" />
            </div>
          </div>
        </motion.div>
        <Card className="flex flex-col">
          <CardHeader>
            <CardDescription className="font-semibold uppercase tracking-wider text-saffron">{t("trainee.next")}</CardDescription>
            <CardTitle className="text-lg">{next ? t(`step.${next.key}`) : "You're all caught up"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">{next ? NEXT_COPY[next.key] : "Keep your employment status updated. We'll remind you at each follow-up milestone."}</p>
            {next && <Button asChild className="self-start"><Link href={STEP_META[next.key].href}>{t("common.continue")}<ArrowRight /></Link></Button>}
          </CardContent>
        </Card>
      </div>

      {openFollowups.length > 0 && (
        <Link href="/trainee/followups" className="flex items-center gap-3 rounded-2xl border border-saffron/40 bg-saffron/10 p-4 transition hover:bg-saffron/15">
          <BellRing className="h-5 w-5 shrink-0 text-saffron" />
          <div className="flex-1 text-sm"><span className="font-semibold">{openFollowups[0].label}</span> follow-up for {openFollowups[0].programme} is waiting for your reply.</div>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <Card>
        <CardHeader><CardTitle>{t("trainee.journey")}</CardTitle></CardHeader>
        <CardContent><JourneyStepper steps={steps} /></CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Soft-skill score" value={c?.soft_skill.score} suffix="/100" icon={ClipboardCheck} hint={c?.soft_skill.completed ? c.soft_skill.band?.toLowerCase() : "Not taken yet"} />
        <StatCard label="Verified skills" value={verifiedSkills} suffix={c ? `/${c.skills.length}` : ""} icon={Sparkles} tone="success" delay={0.05} />
        <StatCard label="Certificates verified" value={c?.certificates.verified} suffix={c ? `/${c.certificates.total}` : ""} icon={FileCheck2} tone="saffron" delay={0.1} />
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between"><div className="text-xs font-medium text-muted-foreground sm:text-sm">Employment</div><Briefcase className="h-4 w-4 text-primary" /></div>
          <div className="mt-3"><StatusBadge status={user.profile?.employment_status} className="text-sm" /></div>
          <Link href="/trainee/employment" className="mt-2 block text-xs font-semibold text-primary">Update status</Link>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href="/trainee/timeline">{t("nav.timeline")}<ArrowRight /></Link></Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(tl.data || []).slice(0, 5).map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="flex-1"><div className="font-medium">{e.title}</div>{e.detail && <div className="text-xs text-muted-foreground">{e.detail}</div>}</div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(e.date)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
