"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, BarChart3, BellRing, Briefcase, Building2, ClipboardCheck, FileSearch, GraduationCap, Landmark,
  LineChart, Lock, Route, ShieldCheck, Sparkles, Target, UserRoundCheck, Users,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { AnimatedNumber, Aurora } from "@/components/common";
import { LanguageSwitcher, ThemeToggle } from "@/components/controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const FLOW = [
  { icon: UserRoundCheck, label: "Register + UTI" },
  { icon: Lock, label: "Consent" },
  { icon: GraduationCap, label: "Training" },
  { icon: FileSearch, label: "Certificate check" },
  { icon: ClipboardCheck, label: "Soft-skill test" },
  { icon: Sparkles, label: "Technical test" },
  { icon: Target, label: "Skill gap plan" },
  { icon: Briefcase, label: "Employment" },
  { icon: BadgeCheck, label: "Employer verified" },
  { icon: BellRing, label: "Follow-ups" },
  { icon: LineChart, label: "Impact analytics" },
];

const PILLARS = [
  { icon: Route, title: "Post-training tracking", body: "Every trainee gets a Unique Trainee ID and a longitudinal record with follow-ups at 30, 90, 180 and 365 days." },
  { icon: FileSearch, title: "Certificate verification", body: "Issuer registry lookup, duplicate detection and tampering indicators. Uncertain cases go to a verification officer." },
  { icon: ClipboardCheck, title: "Mandatory soft-skill test", body: "Seven workplace domains, time-limited and randomised, with domain-wise feedback for every trainee." },
  { icon: ShieldCheck, title: "Secure assessment sessions", body: "Tab switches, focus loss and answer changes are logged as review signals, never as automatic verdicts." },
  { icon: Target, title: "Evidence-linked skill gaps", body: "Gaps are explained with the assessment evidence behind them and turned into a practical improvement plan." },
  { icon: BarChart3, title: "Government impact analytics", body: "District, provider, programme and cohort views with small-group suppression to protect identities." },
];

const PORTALS = [
  { icon: GraduationCap, title: "Trainee", body: "Register, get assessed and update your journey", href: "/register", cta: "Register", alt: { href: "/login?as=trainee", label: "Log in" } },
  { icon: Building2, title: "Training provider", body: "Manage programmes, enrollments and completions", href: "/login?as=provider", cta: "Provider login" },
  { icon: Briefcase, title: "Employer", body: "Confirm employment details for your staff", href: "/login?as=employer", cta: "Employer login" },
  { icon: Landmark, title: "Government", body: "Monitor outcomes and programme impact", href: "/login?as=admin", cta: "Administrator login" },
];

export default function Landing() {
  const { t } = useI18n();
  const { user, home } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api("/public/stats/", { auth: false }).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-transparent bg-background/70 backdrop-blur-lg">
        <div className="container flex h-16 items-center gap-2">
          <Logo />
          <div className="flex-1" />
          <LanguageSwitcher compact />
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm"><Link href={home}>{t("nav.dashboard")}</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/login">{t("landing.cta.login")}</Link></Button>
              <Button asChild size="sm"><Link href="/register">{t("landing.cta.trainee")}</Link></Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Aurora />
        <div className="container relative pb-16 pt-14 sm:pt-20 lg:pb-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-5 bg-card/70 px-3 py-1 backdrop-blur">
              <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-saffron" />{t("landing.badge")}
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.title1")}<br /><span className="text-gradient">{t("landing.title2")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">{t("landing.sub")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/register">{t("landing.cta.trainee")}<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/login">{t("landing.cta.login")}</Link></Button>
            </div>
          </motion.div>

          {/* Live counters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}
            className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Trainees traced", v: stats?.registered },
              { label: "Completed training", v: stats?.completed },
              { label: "Placement rate", v: stats?.placement_rate, s: "%" },
              { label: "Assessments taken", v: stats?.assessments },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl border p-4 text-center">
                <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {s.v == null ? "—" : <AnimatedNumber value={s.v} format={(x) => (s.s ? x.toFixed(1) : Math.round(x).toLocaleString("en-IN"))} />}{s.v != null && s.s}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Live counts from this deployment's fictional demo records</p>
        </div>
      </section>

      {/* Flow */}
      <section className="border-y bg-card/40 py-14">
        <div className="container">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">One continuous record, from training to impact</h2>
            <p className="mt-2 text-muted-foreground">Each step writes to the trainee's longitudinal record and rolls up into programme analytics.</p>
          </div>
          <div className="relative">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-11 lg:gap-2 lg:overflow-visible">
              {FLOW.map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="relative flex w-28 shrink-0 flex-col items-center text-center lg:w-auto">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
                    <f.icon className="h-6 w-6 text-primary" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-saffron text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                  {i < FLOW.length - 1 && <div className="absolute left-[calc(50%+28px)] top-7 hidden h-px w-[calc(100%-56px)] bg-gradient-to-r from-primary/60 to-saffron/60 lg:block" />}
                  <div className="mt-2 text-xs font-medium leading-tight">{f.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Why SkillTrace</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">From claimed skills to verified competency and real employment outcomes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }} className="group rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg">
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/15 to-saffron/15 p-2.5"><p.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="relative overflow-hidden border-t bg-gradient-to-b from-secondary/50 to-background py-16">
        <div className="container relative">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("landing.entry")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((p) => (
              <div key={p.title} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
                <p.icon className="h-7 w-7 text-primary" />
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link href={p.href}>{p.cta}</Link></Button>
                  {p.alt && <Button asChild size="sm" variant="outline"><Link href={p.alt.href}>{p.alt.label}</Link></Button>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Verification officers log in through the same <Link href="/login?as=officer" className="font-semibold text-primary">login page</Link>. Employers without an account can use the secure link sent to their HR email.
          </p>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2"><Users className="h-4 w-4" />Prototype for Smart India Hackathon 2026 · PS 26135 · Department of Skills, Employment, Entrepreneurship and Innovation, Maharashtra</div>
          <div>All people, organisations and figures in this demo are fictional.</div>
        </div>
      </footer>
    </div>
  );
}
