"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/meta/", { auth: false }).then(setMeta);
    refreshUser().then((u) => setF({
      full_name: u.full_name, phone: u.phone, location: u.profile.location, education_level: u.profile.education_level,
      qualification: u.profile.qualification, career_goals: u.profile.career_goals, experience_years: u.profile.experience_years,
      preferred_roles: (u.profile.preferred_roles || []).join(", "),
    }));
  }, [refreshUser]);

  if (!f) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const save = async () => {
    setSaving(true);
    try {
      await api("/me/", { method: "PATCH", body: { full_name: f.full_name, phone: f.phone, profile: {
        location: f.location, education_level: f.education_level, qualification: f.qualification, career_goals: f.career_goals,
        experience_years: f.experience_years || 0, preferred_roles: f.preferred_roles.split(",").map((s) => s.trim()).filter(Boolean) } } });
      await refreshUser();
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const p = user.profile;
  return (
    <>
      <PageHeader title={t("nav.profile")} description="Keep your details current. Skills are managed separately and stay unverified until assessed." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            <Field label={t("reg.fullname")}><Input value={f.full_name} onChange={set("full_name")} /></Field>
            <Field label={t("reg.phone")}><Input value={f.phone} onChange={set("phone")} /></Field>
            <Field label={t("reg.location")}><Input value={f.location} onChange={set("location")} /></Field>
            <Field label={t("reg.education")}><Select value={f.education_level} onValueChange={set("education_level")} options={(meta?.education || []).map(([v, l]) => ({ value: v, label: l }))} /></Field>
            <Field label={t("reg.qualification")} className="sm:col-span-2"><Input value={f.qualification} onChange={set("qualification")} /></Field>
            <Field label="Work experience (years)"><Input type="number" min="0" step="0.5" value={f.experience_years} onChange={set("experience_years")} /></Field>
            <Field label="Preferred job roles" hint="Separate with commas"><Input value={f.preferred_roles} onChange={set("preferred_roles")} /></Field>
            <Field label={t("reg.goals")} className="sm:col-span-2"><Textarea value={f.career_goals} onChange={set("career_goals")} /></Field>
            <div className="sm:col-span-2"><Button onClick={save} loading={saving}>{t("common.save")}</Button></div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>Record identifiers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[["UTI", <span key="u" className="font-mono font-semibold text-primary">{p.uti}</span>], ["District", p.district_name], ["Date of birth", fmtDate(p.dob)], ["Email", user.email], ["Record created", fmtDate(p.created_at)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">UTI format is MH-district-year-sequence. It is not derived from any national ID number.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
