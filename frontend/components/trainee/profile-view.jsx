"use client";

import { useState } from "react";
import { CircleCheck, CircleDashed, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressRing, SectionCard, surface } from "@/components/shared/cards";
import { FieldError, ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { certificates, districts, employment, trainee } from "@/lib/mock-data";
import { toneSoft } from "@/lib/tones";
import { cn } from "@/lib/utils";

const TABS = ["Personal Info", "Education", "Skills", "Certificates", "Training History", "Employment", "Documents"];

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Chip({ children, tone = "blue" }) {
  return (
    <Badge variant="outline" className={cn("rounded-lg border-transparent px-3 py-1.5 text-xs font-semibold", toneSoft[tone])}>
      {children}
    </Badge>
  );
}

function AddSkill({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!value.trim()) return setError("Enter a skill name.");
    onAdd(value.trim());
    setValue("");
    setError("");
    setOpen(false);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-lg border-dashed border-teal-300 text-teal-700">
          <Plus /> Add Skill
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl">
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-2">
          <Label htmlFor="new-skill">New skill</Label>
          <Input id="new-skill" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!!error} aria-describedby="new-skill-error" />
          <FieldError id="new-skill-error" message={error} />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function EditProfile({ profile, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState({});

  function change(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save(e) {
    e.preventDefault();
    const next = {};
    if (!draft.name.trim()) next.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) next.email = "Enter a valid email address.";
    if (!/^(\+91[\s-]?)?[6-9]\d{4}\s?\d{5}$/.test(draft.phone.trim())) next.phone = "Enter a valid Indian mobile number.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(draft);
    setOpen(false);
    toast.success("Profile updated");
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(profile);
      }}
      title="Edit Profile"
      description="Changes to verified fields are re-checked before they appear on reports."
      trigger={
        <Button className="h-11 rounded-[10px] px-5">
          <Pencil /> Edit Profile
        </Button>
      }
    >
      <form noValidate onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-2 sm:col-span-2">
          <Label htmlFor="p-name">Full name</Label>
          <Input id="p-name" value={draft.name} onChange={(e) => change("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby="p-name-error" />
          <FieldError id="p-name-error" message={errors.name} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="p-phone">Phone</Label>
          <Input id="p-phone" type="tel" value={draft.phone} onChange={(e) => change("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby="p-phone-error" />
          <FieldError id="p-phone-error" message={errors.phone} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" value={draft.email} onChange={(e) => change("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby="p-email-error" />
          <FieldError id="p-email-error" message={errors.email} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="p-gender">Gender</Label>
          <Select value={draft.gender} onValueChange={(v) => change("gender", v)}>
            <SelectTrigger id="p-gender" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Female", "Male", "Other", "Prefer not to say"].map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="p-district">District</Label>
          <Select value={draft.district} onValueChange={(v) => change("district", v)}>
            <SelectTrigger id="p-district" className="w-full">
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function CompletionCard({ className }) {
  return (
    <SectionCard title="Profile Completion" className={className}>
      <div className="flex items-center gap-6 lg:flex-col">
        <ProgressRing value={trainee.completion} size={120} />
        <ul className="grid flex-1 gap-2.5 self-stretch">
          {trainee.completionItems.map((item) => (
            <li key={item.label} className="flex items-center justify-between text-sm text-slate-600">
              <span className="flex items-center gap-2">
                {item.done ? <CircleCheck className="size-4 text-teal-500" /> : <CircleDashed className="size-4 text-slate-300" />}
                {item.label}
              </span>
              <span className="text-xs font-medium">{item.done ? "Done" : "Pending"}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

export function ProfileView() {
  const [profile, setProfile] = useState({
    name: trainee.name,
    phone: trainee.phone,
    email: trainee.email,
    gender: trainee.gender,
    district: trainee.district,
  });
  const [skills, setSkills] = useState(trainee.skills);

  const addSkill = (skill) => {
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return toast.info(`${skill} is already listed`);
    setSkills([...skills, skill]);
    toast.success(`${skill} added — pending verification`);
  };

  const skillsBlock = (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <Chip key={s}>{s}</Chip>
      ))}
      <AddSkill onAdd={addSkill} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Header */}
      <section className={cn(surface, "flex flex-col gap-4 p-5 md:flex-row md:items-center")}>
        <div className="flex flex-1 items-center gap-4">
          <UserAvatar name={profile.name} className="size-16 md:size-20 [&_[data-slot=avatar-fallback]]:text-xl" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">Trainee ID: {trainee.id}</p>
            <StatusBadge status="verified" withIcon className="mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-4 md:hidden">
          <ProgressRing value={trainee.completion} size={72} stroke={7} />
          <div>
            <p className="text-lg font-bold">{trainee.completion}%</p>
            <p className="text-xs text-muted-foreground">Profile Completed</p>
          </div>
        </div>
        <div className="max-md:[&>button]:w-full">
          <EditProfile profile={profile} onSave={setProfile} />
        </div>
      </section>

      <Tabs defaultValue={TABS[0]} className="gap-5">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList variant="line" className="h-11 w-max gap-2 border-b border-slate-200 p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="h-11 flex-none px-3 text-slate-500 data-[state=active]:text-blue-600 after:!bg-blue-600"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>

        <TabsContent value="Personal Info" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard title="Basic Information">
            <dl className="grid grid-cols-1 gap-4">
              <Field label="Full Name" value={profile.name} />
              <Field label="Date of Birth" value={trainee.dob} />
              <Field label="Gender" value={profile.gender} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Email" value={profile.email} />
              <Field label="Location" value={`${profile.district}, Maharashtra`} />
            </dl>
          </SectionCard>
          <div className="grid content-start gap-4">
            <SectionCard title="Skills">{skillsBlock}</SectionCard>
            <SectionCard title="Languages">
              <div className="flex flex-wrap gap-2">
                {trainee.languages.map((l) => (
                  <Chip key={l} tone="green">
                    {l}
                  </Chip>
                ))}
              </div>
            </SectionCard>
          </div>
          <CompletionCard className="max-md:hidden" />
        </TabsContent>

        <TabsContent value="Education">
          <SectionCard title="Education">
            <ul className="divide-y">
              {trainee.education.map((e) => (
                <li key={e.degree} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{e.degree}</p>
                    <p className="text-sm text-muted-foreground">{e.institution}</p>
                  </div>
                  <p className="text-sm text-slate-600">
                    {e.year} · {e.score}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="Skills">
          <SectionCard title="Skills" description="New skills stay pending until an assessment verifies them.">
            {skillsBlock}
          </SectionCard>
        </TabsContent>

        <TabsContent value="Certificates">
          <SectionCard title="Certificates">
            <ul className="divide-y">
              {certificates.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.issuer} · {c.issued}
                    </p>
                  </div>
                  <StatusBadge status={c.status} withIcon />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="Training History">
          <SectionCard title="Training History">
            <ul className="divide-y">
              {trainee.trainingHistory.map((t) => (
                <li key={t.programme} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">{t.programme}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.provider} · {t.period}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="Employment">
          <SectionCard title="Employment">
            <ul className="divide-y">
              {employment.timeline.map((job) => (
                <li key={job.period} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-900">{job.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.company} · {job.period} · {job.pay}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="Documents">
          <SectionCard title="Documents">
            <ul className="divide-y">
              {trainee.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-slate-900">{d.name}</p>
                  <StatusBadge status={d.status} withIcon />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
