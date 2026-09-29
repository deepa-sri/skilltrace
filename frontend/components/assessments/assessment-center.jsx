"use client";

import { useState } from "react";
import { CircleQuestionMark, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCard } from "@/components/shared/cards";
import { IconTile } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { assessmentGuidelines, assessments as initial } from "@/lib/mock-data";

function ActionButton({ item, onStart, onFinish }) {
  const [agreed, setAgreed] = useState(false);
  if (item.status === "completed") {
    return <span className="w-24 text-right text-sm font-bold text-emerald-600">{item.score}%</span>;
  }
  const resuming = item.status === "in_progress";
  return (
    <AlertDialog onOpenChange={() => setAgreed(false)}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={resuming ? "outline" : "default"} className="w-24 rounded-lg">
          {resuming ? "Continue" : "Start"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {resuming ? "Resume" : "Start"} {item.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {item.questions} questions · {item.minutes} minutes. The timer {resuming ? "continues from where you left off" : "starts as soon as you begin"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {assessmentGuidelines.slice(0, 4).map((g) => (
            <li key={g} className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-600" aria-hidden="true" /> {g}
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2.5">
          <Checkbox id={`agree-${item.id}`} checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <Label htmlFor={`agree-${item.id}`} className="text-sm leading-snug font-normal">
            I agree to the assessment guidelines and consent to proctoring.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!agreed} onClick={() => (resuming ? onFinish(item) : onStart(item))}>
            {resuming ? "Resume assessment" : "Begin assessment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AssessmentList({ items, onStart, onFinish }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
          <IconTile name={item.icon} tone={item.tone} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{item.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CircleQuestionMark className="size-3.5" aria-hidden="true" /> {item.questions} Questions
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" /> {item.minutes} mins
              </span>
            </p>
            {item.status === "in_progress" && (
              <Progress value={item.progress} className="mt-2 h-1.5 max-w-48" aria-label={`${item.title} ${item.progress}% complete`} />
            )}
            <StatusBadge status={item.status} className="mt-1.5 sm:hidden" />
          </div>
          <StatusBadge status={item.status} className="w-28 max-sm:hidden" />
          <ActionButton item={item} onStart={onStart} onFinish={onFinish} />
        </li>
      ))}
    </ul>
  );
}

export function AssessmentCenter({ defaultTab = "technical" }) {
  const [data, setData] = useState(initial);

  function update(id, patch) {
    setData((d) =>
      Object.fromEntries(Object.entries(d).map(([k, list]) => [k, list.map((a) => (a.id === id ? { ...a, ...patch } : a))]))
    );
  }

  const onStart = (item) => {
    update(item.id, { status: "in_progress", progress: 5 });
    toast.success(`${item.title} started`, { description: "Your progress is saved automatically." });
  };
  const onFinish = (item) => {
    const score = 70 + ((item.questions * 7) % 25);
    update(item.id, { status: "completed", score });
    toast.success(`${item.title} submitted`, { description: `Score: ${score}% — skill verified.` });
  };

  const softDone = data.soft.filter((a) => a.status === "completed").length;

  return (
    <Tabs defaultValue={defaultTab} className="gap-5">
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1 md:w-[440px]">
        <TabsTrigger value="technical" className="rounded-lg data-[state=active]:text-blue-600 max-md:data-[state=active]:bg-blue-600 max-md:data-[state=active]:text-white">
          Technical Skills
        </TabsTrigger>
        <TabsTrigger value="soft" className="rounded-lg data-[state=active]:text-blue-600 max-md:data-[state=active]:bg-blue-600 max-md:data-[state=active]:text-white">
          Soft Skills (Mandatory)
        </TabsTrigger>
      </TabsList>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <TabsContent value="technical">
            <SectionCard title="Available Assessments">
              <AssessmentList items={data.technical} onStart={onStart} onFinish={onFinish} />
            </SectionCard>
          </TabsContent>
          <TabsContent value="soft">
            <SectionCard
              title="Mandatory Soft Skills"
              description={`${softDone} of ${data.soft.length} completed — all are required for certification.`}
            >
              <Progress value={(softDone / data.soft.length) * 100} className="mb-5 h-2" aria-label="Soft skills completion" />
              <AssessmentList items={data.soft} onStart={onStart} onFinish={onFinish} />
            </SectionCard>
          </TabsContent>
        </div>

        <SectionCard title="Assessment Guidelines">
          <ul className="grid grid-cols-1 gap-2">
            {assessmentGuidelines.map((g) => (
              <li key={g} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <ShieldCheck className="size-4 shrink-0 text-blue-600" aria-hidden="true" />
                {g}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </Tabs>
  );
}
