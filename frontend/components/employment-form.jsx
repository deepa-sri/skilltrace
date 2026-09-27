"use client";
import { useEffect, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const PLACED = ["EMPLOYED", "SELF_EMPLOYED", "APPRENTICE"];
const TYPES = [{ value: "FULL_TIME", label: "Full-time" }, { value: "PART_TIME", label: "Part-time" }, { value: "CONTRACT", label: "Contract" }, { value: "GIG", label: "Gig / freelance" }, { value: "SEASONAL", label: "Seasonal" }];

export function useMeta() {
  const [meta, setMeta] = useState(null);
  useEffect(() => { api("/meta/", { auth: false }).then(setMeta).catch(() => {}); }, []);
  return meta;
}

/** Controlled employment + optional non-placement reason form. */
export function EmploymentFields({ value, onChange, withReason = true, compact }) {
  const { t } = useI18n();
  const meta = useMeta();
  const set = (k) => (e) => onChange({ ...value, [k]: e?.target ? e.target.value : e });
  const st = value.status;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("common.status")} className="sm:col-span-2">
        <Select value={st} onValueChange={set("status")} options={(meta?.employment_status || []).map(([v, l]) => ({ value: v, label: l }))} />
      </Field>
      {(st === "EMPLOYED" || st === "APPRENTICE") && (
        <>
          <Field label={t("emp.employer")}><Input value={value.employer_name || ""} onChange={set("employer_name")} /></Field>
          <Field label={t("emp.role")}><Input value={value.job_role || ""} onChange={set("job_role")} /></Field>
          <Field label={t("emp.type")}><Select value={value.employment_type} onValueChange={set("employment_type")} options={TYPES} /></Field>
          {!compact && <Field label={t("emp.start")}><Input type="date" value={value.start_date || ""} onChange={set("start_date")} max={new Date().toISOString().slice(0, 10)} /></Field>}
          {!compact && <Field label="Employer HR email (for verification)" className="sm:col-span-2"><Input type="email" value={value.employer_email || ""} onChange={set("employer_email")} placeholder="optional" /></Field>}
        </>
      )}
      {st === "SELF_EMPLOYED" && <Field label={t("emp.business")} className="sm:col-span-2"><Input value={value.business_type || ""} onChange={set("business_type")} placeholder="e.g. mobile repair shop, tailoring" /></Field>}
      {PLACED.includes(st) && (
        <Field label={t("emp.income")} hint="Share an approximate amount. Used only in de-identified averages." className="sm:col-span-2">
          <Input type="number" inputMode="numeric" min="500" value={value.monthly_income || ""} onChange={set("monthly_income")} />
        </Field>
      )}
      {withReason && st && !PLACED.includes(st) && (
        <>
          <Field label={t("emp.reason")} hint={t("emp.reason.help")} className="sm:col-span-2">
            <Select value={value.reason || "AUTO"} onValueChange={set("reason")}
              options={[{ value: "AUTO", label: "Describe it and let SkillTrace categorise" }, ...(meta?.non_placement_categories || []).map(([v, l]) => ({ value: v, label: l }))]} />
          </Field>
          <Field label="In your words" className="sm:col-span-2"><Textarea value={value.reason_notes || ""} onChange={set("reason_notes")} placeholder="e.g. The openings are in Pune and travel from my village is costly" /></Field>
        </>
      )}
    </div>
  );
}
