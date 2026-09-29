import { AssessmentCenter } from "@/components/assessments/assessment-center";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage({ searchParams }) {
  const { tab } = await searchParams;
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Skill Assessments" description="Verify your skills through secure assessments" />
      <AssessmentCenter defaultTab={tab === "soft" ? "soft" : "technical"} />
    </div>
  );
}
