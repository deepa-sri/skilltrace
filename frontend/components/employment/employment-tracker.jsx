"use client";

import { useState } from "react";
import { BriefcaseBusiness, ChevronDown, Clock, FileText, MapPin, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, surface } from "@/components/shared/cards";
import { PageHeader } from "@/components/shared/page-header";
import { FieldError, ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { WageProgressionChart } from "@/components/charts/charts";
import { districts, employment, employmentTypes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function EmploymentForm({ open, onOpenChange, onSave, trigger }) {
  const empty = { company: "", role: "", type: "Full-time", wage: "", district: "Pune", since: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e) {
    e.preventDefault();
    const next = {};
    if (!form.company.trim()) next.company = form.type === "Self-employed" ? "Enter your business name." : "Enter the employer name.";
    if (!form.role.trim()) next.role = "Enter your role.";
    if (!/^\d{3,7}$/.test(form.wage)) next.wage = "Enter monthly income in rupees (numbers only).";
    if (!form.since) next.since = "Select the start month.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(form);
    setForm(empty);
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title="Update Employment"
      description="Your employer will be asked to confirm these details."
    >
      <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-2 sm:col-span-2">
          <Label htmlFor="e-type">Employment type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger id="e-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="e-company">{form.type === "Self-employed" ? "Business name" : "Employer"}</Label>
          <Input id="e-company" value={form.company} onChange={(e) => set("company", e.target.value)} aria-invalid={!!errors.company} aria-describedby="e-company-error" />
          <FieldError id="e-company-error" message={errors.company} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="e-role">Role</Label>
          <Input id="e-role" value={form.role} onChange={(e) => set("role", e.target.value)} aria-invalid={!!errors.role} aria-describedby="e-role-error" />
          <FieldError id="e-role-error" message={errors.role} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="e-wage">Monthly income (₹)</Label>
          <Input id="e-wage" inputMode="numeric" value={form.wage} onChange={(e) => set("wage", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.wage} aria-describedby="e-wage-error" />
          <FieldError id="e-wage-error" message={errors.wage} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="e-since">Start month</Label>
          <Input id="e-since" type="month" value={form.since} onChange={(e) => set("since", e.target.value)} aria-invalid={!!errors.since} aria-describedby="e-since-error" />
          <FieldError id="e-since-error" message={errors.since} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:col-span-2">
          <Label htmlFor="e-district">Work district</Label>
          <Select value={form.district} onValueChange={(v) => set("district", v)}>
            <SelectTrigger id="e-district" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2 sm:justify-end max-sm:flex-col-reverse">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save & request verification</Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function Timeline({ items }) {
  return (
    <ol className="relative grid gap-6 border-l-2 border-slate-100 pl-6">
      {items.map((job) => (
        <li key={job.period + job.role} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1 -left-[31px] size-3.5 rounded-full border-[3px] bg-white",
              job.status === "current" ? "border-emerald-500" : "border-blue-500"
            )}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-4">
              <p className="text-xs text-muted-foreground sm:text-sm">{job.period}</p>
              <div>
                <p className="font-semibold text-slate-900">{job.role}</p>
                <p className="text-sm text-muted-foreground">{job.company}</p>
                <p className="text-sm text-slate-700">{job.pay}</p>
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Proofs({ proofs, onUpload, id }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <ul className="grid grid-cols-1 gap-2">
        {proofs.map((p) => (
          <li key={p.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-medium text-slate-800">{p.name}</span>
            <StatusBadge status={p.status} />
          </li>
        ))}
      </ul>
      <Label
        htmlFor={`proof-file-${id}`}
        className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 text-sm font-semibold text-blue-600 hover:bg-blue-50 focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <Upload className="size-4" /> Upload employment proof
        <input
          id={`proof-file-${id}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file.name);
            e.target.value = "";
          }}
        />
      </Label>
    </div>
  );
}

export function EmploymentTracker() {
  const [current, setCurrent] = useState(employment.current);
  const [timeline, setTimeline] = useState(employment.timeline);
  const [proofs, setProofs] = useState(employment.proofs);
  const [wages, setWages] = useState(employment.wageHistory);
  const [formOpen, setFormOpen] = useState(false);

  function save(form) {
    const since = new Date(`${form.since}-01`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const wage = Number(form.wage);
    setTimeline((t) => [
      { period: `${since} – Present`, role: form.role, company: form.company, pay: `${inr(wage)}/month`, status: "current" },
      ...t.map((j) => ({ ...j, status: "previous", period: j.period.replace("Present", since) })),
    ]);
    setCurrent({
      ...current,
      company: form.company,
      shortName: form.company.slice(0, 3).toLowerCase(),
      role: form.role,
      type: form.type,
      location: `${form.district}, Maharashtra`,
      since,
      salary: inr(wage),
      verified: false,
    });
    setWages((w) => [...w, { month: since.replace(" 20", " "), wage }]);
    setFormOpen(false);
    toast.success("Employment updated", { description: "Pending employer verification." });
  }

  const uploadProof = (name) => {
    setProofs((p) => [...p, { name, status: "pending" }]);
    toast.success("Proof uploaded", { description: `${name} sent for verification.` });
  };

  const addButton = (
    <Button className="h-11 rounded-[10px] px-5">
      <Plus /> Add Employment
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title="Employment Details"
        description="Track your employment journey and income progression"
        actions={<EmploymentForm open={formOpen} onOpenChange={setFormOpen} onSave={save} trigger={addButton} />}
      />

      {/* Current employment */}
      <Collapsible className={cn(surface, "p-5")}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">Current Employment</h2>
          <div className="flex items-center gap-2">
            <StatusBadge status={current.verified ? "verified" : "pending"} withIcon />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 [&[data-state=open]>svg]:rotate-180" aria-label="Toggle employment details">
                <ChevronDown className="transition-transform" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-2xl font-extrabold tracking-tight md:size-20 md:text-3xl">
            <span className="bg-gradient-to-r from-rose-500 via-violet-600 to-blue-600 bg-clip-text text-transparent">{current.shortName}</span>
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 md:text-lg">{current.company}</p>
            <p className="text-sm text-slate-600">{current.role}</p>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground md:text-sm">
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" /> {current.location}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="size-3.5" aria-hidden="true" /> {current.type}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" /> Since {current.since}
              </li>
            </ul>
          </div>
        </div>
        <CollapsibleContent className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          {current.verified
            ? "Verified by the employer through SkillTrace on 12 Feb 2024. Wages are confirmed with the latest salary slip."
            : "Awaiting employer confirmation. You will be notified once verified."}
        </CollapsibleContent>
      </Collapsible>

      <section aria-label="Employment summary" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          ["Current Monthly Salary", current.salary],
          ["Experience", current.experience],
          ["Employment Type", current.type],
          ["Retention", current.retention],
        ].map(([label, value]) => (
          <div key={label} className={cn(surface, "p-4")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900 md:text-xl">{value}</p>
          </div>
        ))}
      </section>

      {/* Desktop / tablet */}
      <div className="grid grid-cols-1 gap-5 max-md:hidden lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Employment Timeline">
          <Timeline items={timeline} />
        </SectionCard>
        <SectionCard title="Employment Proof">
          <Proofs id="desktop" proofs={proofs} onUpload={uploadProof} />
        </SectionCard>
      </div>

      {/* Mobile */}
      <Accordion type="single" collapsible className="grid grid-cols-1 gap-3 md:hidden">
        <AccordionItem value="status" className={cn(surface, "border-b-0 px-4")}>
          <AccordionTrigger className="text-sm font-semibold">Update Employment Status</AccordionTrigger>
          <AccordionContent>
            <p className="mb-3 text-sm text-muted-foreground">Changed jobs, started a business or joined an apprenticeship?</p>
            <Button className="w-full" onClick={() => setFormOpen(true)}>
              Update status
            </Button>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="proof" className={cn(surface, "border-b-0 px-4")}>
          <AccordionTrigger className="text-sm font-semibold">Upload Employment Proof</AccordionTrigger>
          <AccordionContent>
            <Proofs id="mobile" proofs={proofs} onUpload={uploadProof} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="history" className={cn(surface, "border-b-0 px-4")}>
          <AccordionTrigger className="text-sm font-semibold">Employment History</AccordionTrigger>
          <AccordionContent>
            <Timeline items={timeline} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <SectionCard title="Income Progression" description="Monthly wage reported at each follow-up">
        <WageProgressionChart data={wages} xKey="month" />
      </SectionCard>
    </div>
  );
}
