"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Bell, Briefcase, Check, ClipboardCheck, FileSearch, GraduationCap, Lock, Sparkles, Target, UserRoundCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const STEP_META = {
  register: { icon: UserRoundCheck, href: "/trainee/profile" },
  consent: { icon: Lock, href: "/trainee/consent" },
  training: { icon: GraduationCap, href: "/trainee/training" },
  certificate: { icon: FileSearch, href: "/trainee/certificates" },
  skills: { icon: Sparkles, href: "/trainee/skills" },
  soft: { icon: ClipboardCheck, href: "/trainee/assessments" },
  technical: { icon: BadgeCheck, href: "/trainee/assessments" },
  gap: { icon: Target, href: "/trainee/competency" },
  employment: { icon: Briefcase, href: "/trainee/employment" },
  followup: { icon: Bell, href: "/trainee/followups" },
};

export function JourneyStepper({ steps = [] }) {
  const { t } = useI18n();
  const firstOpen = steps.findIndex((s) => !s.done);
  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex min-w-[720px] items-start">
        {steps.map((s, i) => {
          const M = STEP_META[s.key];
          const current = i === firstOpen;
          return (
            <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && <div className={cn("absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2", steps[i - 1].done ? "bg-primary" : "bg-border")} />}
              <Link href={M.href} className="relative z-10">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card transition-colors",
                    s.done ? "border-primary bg-primary text-primary-foreground" : current ? "border-saffron text-saffron ring-4 ring-saffron/20" : "text-muted-foreground")}>
                  {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <M.icon className="h-4 w-4" />}
                </motion.div>
              </Link>
              <div className={cn("mt-2 px-1 text-[11px] font-medium leading-tight", s.done ? "text-foreground" : current ? "text-saffron" : "text-muted-foreground")}>
                {t(`step.${s.key}`)}
                {s.mandatory && !s.done && <div className="text-[10px] font-semibold uppercase text-saffron">required</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
