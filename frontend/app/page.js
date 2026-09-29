import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/landing/site-header";
import { Icon, IconTile } from "@/components/shared/icon";
import { Logo } from "@/components/shared/logo";
import { surface } from "@/components/shared/cards";
import { landingFeatures, landingStats, lifecycle, roles } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function HowItWorks() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-12 rounded-[10px] border-slate-200 bg-white px-6 text-slate-800 shadow-card">
          <Play className="fill-current" /> Watch How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>How SkillTrace works</DialogTitle>
          <DialogDescription>One verified record follows each trainee across the skilling lifecycle.</DialogDescription>
        </DialogHeader>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lifecycle.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <IconTile name={step.icon} tone="blue" size="sm" />
              <div>
                <p className="text-sm font-semibold">
                  {i + 1}. {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPage() {
  return (
    <div id="top" className="min-h-svh bg-[url(/assets/backgrounds/skilltrace-gradient-bg.svg)] bg-cover bg-top">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-8 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
          <div className="max-lg:text-center">
            <h1 className="text-[2rem] leading-[1.12] font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
              Track Skills. Verify Outcomes. <span className="text-violet-600">Build</span>{" "}
              <span className="text-blue-600">Stronger</span>{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Futures.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-slate-600 sm:text-lg lg:mx-0">
              A complete skilling lifecycle platform to verify skills, track employment outcomes and measure real impact.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="h-12 w-full max-w-60 rounded-[10px] px-8 sm:w-auto">
                <Link href="/login">
                  Get Started <ArrowRight />
                </Link>
              </Button>
              <HowItWorks />
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {landingFeatures.map((f) => (
                <li key={f.title} className={cn(surface, "flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700")}>
                  <IconTile name={f.icon} tone={f.tone} size="sm" />
                  {f.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-2xl max-sm:hidden">
            <div className="relative aspect-[872/708] overflow-hidden rounded-3xl">
              <Image
                src="/assets/illustrations/hero-maharashtra.jpg"
                alt="Smiling trainee holding a laptop in front of the Gateway of India, Mumbai"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover"
              />
              <div className="absolute top-[63%] right-[2.5%] bottom-[15%] left-[60%] grid place-items-center rounded-xl bg-white px-3 shadow-soft">
                <p className="text-center text-sm leading-snug font-bold text-slate-900 md:text-base">
                  Skilled Maharashtra
                  <br />
                  Stronger Tomorrow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section aria-label="Platform reach" className="mx-auto max-w-7xl px-4 md:px-8">
          <dl className={cn(surface, "grid grid-cols-2 gap-y-6 px-4 py-6 md:grid-cols-4 md:px-10")}>
            {landingStats.map((s, i) => (
              <div key={s.label} className={cn("text-center md:text-left", i > 0 && "md:border-l md:pl-10")}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold text-blue-600 md:text-3xl">{s.value}</dd>
                <dd className="text-sm text-slate-500">{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-center text-xs text-muted-foreground md:text-left">Illustrative demo figures.</p>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-600">Platform</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              One trusted record from enrolment to long-term outcomes
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {landingFeatures.map((f) => (
              <div key={f.title} className={cn(surface, "p-5")}>
                <IconTile name={f.icon} tone={f.tone} size="lg" />
                <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Lifecycle */}
        <section id="about" className="scroll-mt-20 border-y border-slate-200/70 bg-white/70">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">The skilling lifecycle, traced</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              SkillTrace links every stage so departments can see not just who was trained, but who got work and stayed in it.
            </p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {lifecycle.map((step, i) => (
                <li key={step.title} className="relative">
                  <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                    <span className="grid size-10 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Role entry points */}
        <section id="roles" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Built for every stakeholder</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <Link
                key={role.id}
                href={`/login?role=${role.id}`}
                className={cn(surface, "group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-blue-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none")}
              >
                <IconTile name={role.icon} tone={role.tone} size="lg" />
                <h3 className="mt-4 font-bold text-slate-900">{role.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">{role.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Continue <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-slate-500">Skilling-outcome intelligence for Maharashtra.</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Icon name="map" className="size-4 text-blue-600" /> Mumbai, Maharashtra
            </p>
            <p className="mt-1">support@skilltrace.example</p>
          </div>
        </div>
        <Separator />
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 md:px-8">
          © 2026 SkillTrace by JobGenie. Figures shown are demo data.
        </p>
      </footer>
    </div>
  );
}
