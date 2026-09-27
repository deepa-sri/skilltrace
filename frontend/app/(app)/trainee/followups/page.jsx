"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, MessageSquareReply } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { EmploymentFields } from "@/components/employment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { cn, fmtDate } from "@/lib/utils";

export default function FollowupsPage() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const { data, loading, reload } = useApi("/me/followups/");
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ status: "" });
  const [busy, setBusy] = useState(false);

  const respond = async () => {
    setBusy(true);
    try {
      const res = await api(`/me/followups/${open.id}/respond/`, { method: "POST", body: form });
      toast.success(res.detail);
      setOpen(null);
      reload(); refreshUser();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const groups = (data || []).reduce((acc, f) => ((acc[f.programme] = acc[f.programme] || []).push(f), acc), {});
  return (
    <>
      <PageHeader title={t("fu.title")} description={t("fu.intro")} />
      {loading && !data ? <LoadingBlock /> : !data?.length ? (
        <EmptyState icon={CalendarClock} title="No follow-ups scheduled" description="Follow-ups are scheduled at 30, 90, 180 and 365 days once your provider marks a programme complete." />
      ) : Object.entries(groups).map(([prog, items]) => (
        <Card key={prog} className="mb-6">
          <CardContent className="pt-5">
            <div className="mb-5 font-semibold">{prog}</div>
            <ol className="relative grid gap-6 sm:grid-cols-4 sm:gap-3">
              <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-border sm:left-4 sm:right-4 sm:top-[15px] sm:h-0.5 sm:w-auto" />
              {items.map((f) => (
                <li key={f.id} className="relative flex gap-4 sm:flex-col sm:gap-3">
                  <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                    f.status === "RESPONDED" ? "border-success text-success" : f.can_respond ? "border-saffron text-saffron ring-4 ring-saffron/20" : "text-muted-foreground")}>
                    {f.status === "RESPONDED" ? <CheckCircle2 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs text-muted-foreground">Due {fmtDate(f.due_date)} · {f.channel}{f.attempts ? ` · ${f.attempts} reminder${f.attempts > 1 ? "s" : ""}` : ""}</div>
                    <StatusBadge status={f.status} />
                    {f.status === "RESPONDED" && f.response?.status && <div className="text-xs text-muted-foreground">Reported: {f.response.status.toLowerCase().replace(/_/g, " ")}{f.response.income ? ` · ₹${f.response.income.toLocaleString("en-IN")}` : ""}</div>}
                    {f.can_respond && <Button size="sm" onClick={() => { setForm({ status: "" }); setOpen(f); }}><MessageSquareReply />{t("fu.respond")}</Button>}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">Channels: in-app notifications are live. <Badge variant="outline">SMS</Badge> <Badge variant="outline">WhatsApp</Badge> <Badge variant="outline">IVR</Badge> are planned integrations and not active in this prototype.</p>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{open?.label}</DialogTitle><DialogDescription>What are you doing now after {open?.programme}?</DialogDescription></DialogHeader>
          <EmploymentFields value={form} onChange={setForm} compact />
          <DialogFooter><Button variant="outline" onClick={() => setOpen(null)}>{t("common.cancel")}</Button><Button onClick={respond} loading={busy} disabled={!form.status}>{t("common.submit")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
