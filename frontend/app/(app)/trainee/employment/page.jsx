"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, Briefcase, Copy, Pencil, Send, ShieldQuestion } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { EmploymentFields, PLACED, useMeta } from "@/components/employment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDate, inr } from "@/lib/utils";

export default function EmploymentPage() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const meta = useMeta();
  const emp = useApi("/me/employment/");
  const reasons = useApi("/me/non-placement/");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status: "" });
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState(null);
  const [hrEmail, setHrEmail] = useState("");
  const [link, setLink] = useState(null);

  const current = emp.data?.find((o) => o.is_current);
  const wages = (emp.data || []).filter((o) => o.monthly_income).slice().reverse().map((o) => ({ label: fmtDate(o.recorded_at, { month: "short", year: "2-digit" }), income: o.monthly_income }));

  const save = async () => {
    setBusy(true);
    try {
      const { reason, reason_notes, ...body } = form;
      Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
      await api("/me/employment/", { method: "POST", body });
      if (!PLACED.includes(form.status) && (reason_notes || (reason && reason !== "AUTO"))) {
        await api("/me/non-placement/", { method: "POST", body: { category: reason || "AUTO", notes: reason_notes || "" } });
      }
      toast.success("Employment status updated");
      setOpen(false);
      emp.reload(); reasons.reload(); refreshUser();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const requestVerify = async () => {
    setBusy(true);
    try {
      const res = await api(`/me/employment/${verify.id}/request-verification/`, { method: "POST", body: { employer_email: hrEmail } });
      setLink(res.verification_link || null);
      toast.success(res.verification_status === "MANUAL_REVIEW" ? "Sent for manual review" : "Verification request sent to employer");
      emp.reload();
      if (!res.verification_link) setVerify(null);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const correct = async (id, category) => {
    try { await api(`/me/non-placement/${id}/`, { method: "PATCH", body: { category } }); reasons.reload(); toast.success("Reason corrected"); } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title={t("nav.employment")} description="Report employment, self-employment or apprenticeship. Employers can confirm details with your consent."
        actions={<Button onClick={() => { setForm({ status: current?.status || "" }); setOpen(true); }}><Pencil />{t("emp.update")}</Button>} />
      {emp.loading && !emp.data ? <LoadingBlock /> : !emp.data?.length ? (
        <EmptyState icon={Briefcase} title="No employment record yet" description="Tell us what you are doing now, whether working, studying or still looking." action={<Button onClick={() => setOpen(true)}>{t("emp.update")}</Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader>
              <CardDescription>Current status</CardDescription>
              <div className="flex flex-wrap items-center gap-2"><CardTitle className="text-xl">{current?.status_label}</CardTitle>{current && PLACED.includes(current.status) && <StatusBadge status={current.verification_status} />}</div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {current && (
                <div className="grid grid-cols-2 gap-3">
                  {[["Employer", current.employer_name || current.business_type], ["Role", current.job_role], ["Monthly income", inr(current.monthly_income)], ["Type", current.type_label], ["Since training", current.months_since_training != null ? `${current.months_since_training} months` : "—"], ["Recorded", fmtDate(current.recorded_at)]].map(([k, v]) => (
                    <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div className="font-medium">{v || "—"}</div></div>
                  ))}
                </div>
              )}
              {current && PLACED.includes(current.status) && ["SELF_REPORTED", "REJECTED", "UNABLE"].includes(current.verification_status) && (
                <Button variant="outline" onClick={() => { setVerify(current); setHrEmail(current.employer_email || ""); setLink(null); }}><ShieldQuestion />{t("emp.verify")}</Button>
              )}
              {current?.verifications?.map((v, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">Employer verification <b>{v.status.toLowerCase()}</b> · requested {fmtDate(v.requested_at)}{v.responded_at && ` · answered ${fmtDate(v.responded_at)}`}{v.notes && ` · "${v.notes}"`}</div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Income progression</CardTitle><CardDescription>From your updates and follow-up responses</CardDescription></CardHeader>
            <CardContent>
              {wages.length > 1 ? (
                <div className="h-52">
                  <ResponsiveContainer>
                    <AreaChart data={wages} margin={{ left: -10, right: 8, top: 8 }}>
                      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="1" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Area dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#wg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground">Income progression appears after two or more updates with income.</p>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {emp.data.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm">
                  <StatusBadge status={o.status} />
                  <span className="font-medium">{o.employer_name || o.business_type || ""}</span>
                  {o.monthly_income && <span className="text-muted-foreground">{inr(o.monthly_income)}/month</span>}
                  <span className="flex-1" />
                  <Badge variant="outline">{o.source === "FOLLOWUP" ? "Follow-up" : "Self update"}</Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(o.recorded_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {reasons.data?.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Non-placement reasons</CardTitle><CardDescription>You can correct any reason. Each reason links to a suggested intervention.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {reasons.data.map((r) => (
              <div key={r.id} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_220px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{r.category_label}</span><Badge variant="secondary">{r.categorised_by === "TRAINEE" ? "You chose" : <><Bot />{r.categorised_by === "GEMINI" ? "Gemini" : "Auto"}-categorised</>}</Badge></div>
                  {r.notes && <p className="mt-1 text-sm text-muted-foreground">“{r.notes}”</p>}
                  <p className="mt-2 text-sm"><span className="font-medium text-primary">Suggested: </span>{r.intervention}</p>
                </div>
                <Select value={r.category} onValueChange={(v) => correct(r.id, v)} options={(meta?.non_placement_categories || []).map(([v, l]) => ({ value: v, label: l }))} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{t("emp.update")}</DialogTitle><DialogDescription>Only share what is needed. Income is used in de-identified averages.</DialogDescription></DialogHeader>
          <EmploymentFields value={form} onChange={setForm} />
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save} loading={busy} disabled={!form.status}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verify} onOpenChange={(o) => !o && setVerify(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("emp.verify")}</DialogTitle>
            <DialogDescription>{verify?.status === "SELF_EMPLOYED" ? "Self-employment is reviewed by a verification officer." : "We send a secure link to your employer's HR email. They can confirm, reject or dispute the details you reported."}</DialogDescription></DialogHeader>
          {link ? (
            <div className="space-y-2">
              <p className="text-sm">Request created. In production this link is emailed to HR. For the demo, share it directly:</p>
              <div className="flex gap-2"><Input readOnly value={link} className="font-mono text-xs" /><Button size="icon" variant="outline" onClick={() => { navigator.clipboard?.writeText(link); toast.success("Copied"); }}><Copy /></Button></div>
            </div>
          ) : verify?.status !== "SELF_EMPLOYED" && <Input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="hr@company.com" />}
          <DialogFooter>{link ? <Button onClick={() => setVerify(null)}>Done</Button> : <Button onClick={requestVerify} loading={busy}><Send />Send request</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
