import { PageHeader } from "@/components/shared/page-header";
import { ProgrammeBrowser } from "@/components/training/programme-browser";

export const metadata = { title: "Training Programs" };

export default function TrainingPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Available Training Programs" description="Explore government and partner training programs" />
      <ProgrammeBrowser />
    </div>
  );
}
