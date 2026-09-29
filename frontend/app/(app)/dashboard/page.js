import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionCard, StatCard, surface } from "@/components/shared/cards";
import { IconTile } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { JourneyStepper } from "@/components/dashboard/journey-stepper";
import { certificates, employment, followUps, journeySteps, trainee, traineeRecommendations } from "@/lib/mock-data";
import { toneSoft } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const recommendationSurface = {
  blue: "bg-blue-50/70 border-blue-100",
  green: "bg-emerald-50/70 border-emerald-100",
  purple: "bg-violet-50/70 border-violet-100",
};

export default function DashboardPage() {
  const verifiedCount = certificates.filter((c) => c.status === "verified").length;
  const myFollowUp = followUps.find((f) => f.name === trainee.name);
  return (
    <div className="grid grid-cols-1 gap-5 md:gap-6">
      <h1 className="sr-only">Trainee dashboard</h1>

      {/* Greeting */}
      <section className="flex items-center gap-4 max-md:flex-row-reverse max-md:justify-between">
        <UserAvatar name={trainee.name} className="size-12 md:size-16 [&_[data-slot=avatar-fallback]]:text-lg" />
        <div>
          <p className="text-xl font-bold text-slate-900 md:text-2xl">
            <span className="md:hidden">Hi, {trainee.firstName}!</span>
            <span className="max-md:hidden">Good Morning, {trainee.firstName}!</span>{" "}
            <span aria-hidden="true">👋</span>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="md:hidden">Let&apos;s continue your journey</span>
            <span className="max-md:hidden">Track your journey. Build your future.</span>
          </p>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {trainee.stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <SectionCard title="Your Progress" description="Your skilling journey so far">
        <JourneyStepper steps={journeySteps} />
      </SectionCard>

      {/* Recommendations */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900">Recommended for You</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {traineeRecommendations.map((r) => (
            <div key={r.title} className={cn("flex gap-3 rounded-2xl border p-4 md:flex-col", recommendationSurface[r.tone])}>
              <IconTile name={r.icon} tone={r.tone} className="bg-white" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-500">{r.description}</p>
              </div>
              <Button asChild size="sm" className="self-center rounded-lg px-5 md:self-start">
                <Link href={r.href}>{r.action}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Status overview */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          title="Training Status"
          action={
            <Button asChild variant="ghost" size="sm" className="text-blue-600">
              <Link href="/training">
                Browse <ArrowRight />
              </Link>
            </Button>
          }
        >
          <ul className="grid grid-cols-1 gap-4">
            {trainee.trainingHistory.map((t) => (
              <li key={t.programme}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-800">{t.programme}</span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t.provider} · {t.period}
                </p>
                <Progress value={100} aria-label={`${t.programme} progress`} className="h-1.5" />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Skills & Certificates"
          action={
            <Button asChild variant="ghost" size="sm" className="text-blue-600">
              <Link href="/certificates">
                View <ArrowRight />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {trainee.skills.map((skill) => (
              <Badge key={skill} variant="outline" className={cn("rounded-lg border-transparent px-2.5 py-1", toneSoft.blue)}>
                {skill}
              </Badge>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-bold text-emerald-600">{verifiedCount}</p>
              <p className="text-xs text-emerald-700">Verified certificates</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-bold text-amber-600">{certificates.length - verifiedCount}</p>
              <p className="text-xs text-amber-700">Pending / action needed</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Employment & Follow-up">
          <div className={cn(surface, "flex items-center gap-3 p-3 shadow-none")}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-white text-lg font-extrabold text-blue-700">
              {employment.current.shortName}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{employment.current.role}</p>
              <p className="truncate text-xs text-muted-foreground">{employment.current.company}</p>
            </div>
            <StatusBadge status="verified" withIcon />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Monthly wage</dt>
              <dd className="font-semibold">{employment.current.salary}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Retention</dt>
              <dd className="font-semibold">{employment.current.retention}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last follow-up</dt>
              <dd className="font-semibold">{myFollowUp.lastFollowUp}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Next follow-up</dt>
              <dd className="font-semibold text-blue-600">{myFollowUp.nextFollowUp}</dd>
            </div>
          </dl>
          <Button asChild variant="outline" className="mt-4 w-full rounded-lg">
            <Link href="/employment">Update employment</Link>
          </Button>
        </SectionCard>
      </section>
    </div>
  );
}
