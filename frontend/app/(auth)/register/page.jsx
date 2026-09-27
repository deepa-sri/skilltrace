"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, IdCard, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CONSENT_HELP = {
  TRAINING_RECORDS: "Needed to create your trainee record and link your training history.",
  CERT_VERIFICATION: "Lets us check certificate details with the issuing organisation.",
  SKILL_ASSESSMENT: "Lets you take assessments and stores your scores and session logs.",
  EMPLOYMENT_FOLLOWUP: "We send short check-ins at 30, 90, 180 and 365 days after training.",
  GOVT_ANALYTICS: "Your data is counted only in de-identified totals for policy decisions.",
  EMPLOYER_VERIFICATION: "Lets your employer confirm the job details you report.",
};

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const { accept } = useAuth();
  const router = useRouter();
  const [meta, setMeta] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dup, setDup] = useState(null);
  const [done, setDone] = useState(null);
  const [f, setF] = useState({
    full_name: "", email: "", phone: "", password: "", dob: "", gender: "", district: "", location: "",
    education_level: "", qualification: "", employment_status: "SEEKING", career_goals: "",
    consents: { TRAINING_RECORDS: true, CERT_VERIFICATION: true, SKILL_ASSESSMENT: true, EMPLOYMENT_FOLLOWUP: true, GOVT_ANALYTICS: true, EMPLOYER_VERIFICATION: false },
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  useEffect(() => {
    api("/meta/", { auth: false }).then(setMeta).catch((e) => toast.error(e.message));
  }, []);

  const valid0 = f.full_name.trim().length > 2 && /\S+@\S+\.\S+/.test(f.email) && /^[6-9]\d{9}$/.test(f.phone) && f.password.length >= 8 && f.dob && f.gender;
  const valid1 = !!f.district && !!f.education_level;

  const submit = async (confirm = false) => {
    setLoading(true);
    try {
      const data = await api("/auth/register/", { method: "POST", auth: false, body: { ...f, preferred_language: lang, confirm_not_duplicate: confirm } });
      accept(data);
      setDup(null);
      setDone(data.user);
      import("canvas-confetti").then((m) => m.default({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ["#0f766e", "#f59e0b", "#14b8a6"] }));
    } catch (e) {
      if (e.status === 409 && e.data?.code === "possible_duplicate") setDup(e.data);
      else toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const uti = done.profile?.uti;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15"><Check className="h-7 w-7 text-success" /></div>
        <h1 className="text-2xl font-bold">Welcome, {done.full_name.split(" ")[0]}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("reg.done")}</p>
        <div className="relative mx-auto mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(190_70%_22%)] p-6 text-left text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-saffron/40 blur-2xl" />
          <div className="relative flex items-center gap-2 text-xs uppercase tracking-widest opacity-80"><IdCard className="h-4 w-4" />Unique Trainee Identifier</div>
          <div className="relative mt-3 font-mono text-2xl font-bold tracking-wider sm:text-3xl">{uti}</div>
          <div className="relative mt-4 text-sm opacity-90">{done.full_name} · {meta?.districts.find((d) => d.code === done.district)?.name}</div>
        </div>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => { navigator.clipboard?.writeText(uti); toast.success("UTI copied"); }}><Copy />Copy UTI</Button>
        <p className="mt-2 text-xs text-muted-foreground">Use this ID with any training provider in Maharashtra. It links all your programmes to one record.</p>
        <Button size="lg" className="mt-6 w-full" onClick={() => router.replace("/trainee")}>{t("common.continue")}<ArrowRight /></Button>
      </motion.div>
    );
  }

  const steps = [t("reg.step.identity"), t("reg.step.profile"), t("reg.step.consent")];
  const opts = (arr) => (arr || []).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="w-full max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">{t("auth.register")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.haveaccount")} <Link href="/login" className="font-semibold text-primary">{t("auth.login")}</Link></p>

      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors", i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "text-muted-foreground")}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            {i < steps.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>

      <div className="mt-6 min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
            {step === 0 && (
              <>
                <Field label={t("reg.fullname")}><Input value={f.full_name} onChange={set("full_name")} placeholder="As on your ID or certificate" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("reg.email")}><Input type="email" value={f.email} onChange={set("email")} /></Field>
                  <Field label={t("reg.phone")} error={f.phone && !/^[6-9]\d{9}$/.test(f.phone) ? "10-digit mobile number" : null}>
                    <Input inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/\D/g, ""))} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("reg.dob")}><Input type="date" value={f.dob} onChange={set("dob")} max={new Date().toISOString().slice(0, 10)} /></Field>
                  <Field label={t("reg.gender")}><Select value={f.gender} onValueChange={set("gender")} options={opts(meta?.genders)} /></Field>
                </div>
                <Field label={t("auth.password")} hint="At least 8 characters, not a common password"><Input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("reg.district")}><Select value={f.district} onValueChange={set("district")} options={(meta?.districts || []).map((d) => ({ value: d.code, label: d.name }))} /></Field>
                  <Field label={t("reg.location")}><Input value={f.location} onChange={set("location")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("reg.education")}><Select value={f.education_level} onValueChange={set("education_level")} options={opts(meta?.education)} /></Field>
                  <Field label={t("reg.status")}><Select value={f.employment_status} onValueChange={set("employment_status")} options={opts(meta?.employment_status)} /></Field>
                </div>
                <Field label={t("reg.qualification")}><Input value={f.qualification} onChange={set("qualification")} placeholder="e.g. ITI Electrician, B.Com" /></Field>
                <Field label={t("reg.goals")}><Textarea value={f.career_goals} onChange={set("career_goals")} placeholder="What kind of work do you want in the next year?" /></Field>
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground">{t("reg.consent.intro")}</p>
                <div className="divide-y rounded-2xl border bg-card">
                  {(meta?.consent_purposes || []).map((c) => (
                    <label key={c.code} className="flex cursor-pointer items-start gap-3 p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">{c.label}{c.required && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">{t("reg.consent.required")}</span>}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{CONSENT_HELP[c.code]}</div>
                      </div>
                      <Switch checked={!!f.consents[c.code]} disabled={c.required}
                        onCheckedChange={(v) => setF((s) => ({ ...s, consents: { ...s.consents, [c.code]: v } }))} />
                    </label>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Consent version {meta?.consent_version}. Every change is time-stamped in your consent history. National ID numbers are not collected.</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft />{t("common.back")}</Button>}
        <div className="flex-1" />
        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 0 ? !valid0 : !valid1}>{t("common.continue")}<ArrowRight /></Button>
        ) : (
          <Button onClick={() => submit(false)} loading={loading}>{t("auth.register")}</Button>
        )}
      </div>

      <Dialog open={!!dup} onOpenChange={(o) => !o && setDup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TriangleAlert className="h-5 w-5 text-saffron" />Possible existing record</DialogTitle>
            <DialogDescription>{dup?.detail}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dup?.matches?.map((m) => (
              <div key={m.uti} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span className="font-mono">{m.uti}</span>
                <span className="text-xs text-muted-foreground">name {Math.round(m.name_similarity * 100)}% · {m.phone_match ? "same phone" : ""} {m.dob_match ? "· same DOB" : ""}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" asChild><Link href="/login">Log in instead</Link></Button>
            <Button variant="saffron" loading={loading} onClick={() => submit(true)}>This is a different person</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
