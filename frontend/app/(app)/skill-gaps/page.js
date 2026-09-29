import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoNote, ProgressRow, SectionCard } from "@/components/shared/cards";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { DonutWithLegend, RankedBarChart, REASON_COLORS } from "@/components/charts/charts";
import { DistrictGapCard } from "@/components/analytics/district-gap-card";
import { skillGaps } from "@/lib/mock-data";
import { chartColors, toneSoft } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const metadata = { title: "Skill Gap Analysis" };

export default function SkillGapsPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title="Skill Gap Analysis"
        description="Identify missing skills and training needs"
        actions={
          <Button asChild variant="outline" className="h-10 rounded-[10px]">
            <Link href="/ai-insights">
              Ask AI about gaps <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Top Skill Gaps" description="Share of assessed trainees below the required level">
          <div className="grid grid-cols-1 gap-4">
            {skillGaps.top.map((g) => (
              <ProgressRow key={g.skill} label={g.skill} value={g.gap} tone={g.tone} icon={<Icon name="skills" className="size-4 text-slate-400 max-sm:hidden" />} />
            ))}
          </div>
        </SectionCard>

        <DistrictGapCard data={skillGaps.byDistrict} />

        <SectionCard title="Non-Placement Reasons" className="lg:col-span-2 xl:col-span-1">
          <DonutWithLegend data={skillGaps.nonPlacementReasons} nameKey="reason" colors={REASON_COLORS} label="Reasons trainees were not placed" />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Gap by Skill Category">
          <div className="grid grid-cols-1 gap-4">
            {skillGaps.categories.map((c, i) => (
              <ProgressRow key={c.name} label={c.name} value={c.gap} tone={["blue", "purple", "teal", "amber"][i]} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Course Comparison" description="Average skill gap by course">
          <RankedBarChart data={skillGaps.byCourse} nameKey="course" valueKey="gap" name="Skill gap" color={chartColors.orange} height={230} label="Average skill gap by course" />
        </SectionCard>

        <SectionCard title="Recommendations" className="lg:col-span-2 xl:col-span-1">
          <ul className="grid grid-cols-1 gap-3">
            {skillGaps.recommendations.map((r) => (
              <li key={r.title} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneSoft[r.tone])}>
                  <Lightbulb className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <DemoNote />
    </div>
  );
}
