"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Building2, Briefcase, GraduationCap, Landmark, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn, ROLE_HOME } from "@/lib/utils";

const DEMO = [
  { key: "trainee", icon: GraduationCap, label: "Trainee", id: "priya.demo@skilltrace.in" },
  { key: "provider", icon: Building2, label: "Provider", id: "provider.demo@skilltrace.in" },
  { key: "employer", icon: Briefcase, label: "Employer", id: "hr.demo@skilltrace.in" },
  { key: "officer", icon: ShieldCheck, label: "Officer", id: "officer.demo@skilltrace.in" },
  { key: "admin", icon: Landmark, label: "Government", id: "admin.demo@skilltrace.in" },
];

function LoginForm() {
  const { t } = useI18n();
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const as = params.get("as");

  useEffect(() => {
    if (ready && user) router.replace(params.get("next") || ROLE_HOME[user.role]);
  }, [ready, user, router, params]);

  useEffect(() => {
    const d = DEMO.find((x) => x.key === as);
    if (d) setIdentifier(d.id);
  }, [as]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(identifier.trim(), password);
      toast.success(`Welcome, ${u.full_name}`);
      router.replace(params.get("next") || ROLE_HOME[u.role]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold tracking-tight">{t("auth.login")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Trainees can use their email, mobile number or Unique Trainee ID.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label={t("auth.identifier")}>
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="name@example.com / 98xxxxxxxx / MH-PNE-2026-000001" required />
        </Field>
        <Field label={t("auth.password")}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={loading}>{t("auth.login")}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.noaccount")} <Link href="/register" className="font-semibold text-primary">{t("auth.register")}</Link>
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">{t("auth.demo")}</div>
          <div className="text-xs text-muted-foreground">password <code className="rounded bg-muted px-1.5 py-0.5 font-mono">Demo@1234</code></div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DEMO.map((d) => (
            <button key={d.key} type="button" onClick={() => { setIdentifier(d.id); setPassword("Demo@1234"); }}
              className={cn("flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition hover:border-primary hover:bg-primary/5", identifier === d.id && "border-primary bg-primary/5 text-primary")}>
              <d.icon className="h-4 w-4" />{d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
