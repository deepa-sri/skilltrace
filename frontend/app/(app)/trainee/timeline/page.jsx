"use client";
import { motion } from "framer-motion";
import { BadgeCheck, Bell, Briefcase, ClipboardCheck, FileSearch, GraduationCap, HelpCircle, UserRoundCheck } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const TYPE = {
  registration: [UserRoundCheck, "bg-primary"], training: [GraduationCap, "bg-sky-600"], certificate: [FileSearch, "bg-violet-600"],
  assessment: [ClipboardCheck, "bg-amber-500"], employment: [Briefcase, "bg-emerald-600"], verification: [BadgeCheck, "bg-teal-600"],
  followup: [Bell, "bg-rose-500"], reason: [HelpCircle, "bg-slate-500"],
};

export default function TimelinePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, loading } = useApi("/me/timeline/");
  if (loading && !data) return <LoadingBlock />;
  return (
    <>
      <PageHeader title={t("timeline.title")} description={`Everything linked to ${user.profile?.uti}, newest first. This is the record used for outcome tracking.`} />
      {!data?.length ? <EmptyState title={t("common.none")} /> : (
        <Card><CardContent className="pt-6">
          <ol className="relative ml-4 border-l-2 border-dashed">
            {data.map((e, i) => {
              const [Icon, bg] = TYPE[e.type] || TYPE.reason;
              return (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.6) }} className="mb-6 ml-7 last:mb-0">
                  <span className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full text-white ring-4 ring-card ${bg}`}><Icon className="h-4 w-4" /></span>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <div className="font-medium">{e.title}</div>
                    <time className="shrink-0 text-xs text-muted-foreground">{fmtDate(e.date)}</time>
                  </div>
                  {e.detail && <div className="text-sm text-muted-foreground">{e.detail}</div>}
                </motion.li>
              );
            })}
          </ol>
        </CardContent></Card>
      )}
    </>
  );
}
