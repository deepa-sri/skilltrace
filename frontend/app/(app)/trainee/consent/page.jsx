"use client";
import { useState } from "react";
import { toast } from "sonner";
import { History, ShieldAlert, ShieldCheck } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDateTime } from "@/lib/utils";

export default function ConsentPage() {
  const { t } = useI18n();
  const { refreshUser, logout } = useAuth();
  const { data, loading, setData } = useApi("/me/consents/");
  const [busy, setBusy] = useState(null);
  const [withdraw, setWithdraw] = useState(false);
  const [confirm, setConfirm] = useState("");

  const toggle = async (purpose, granted) => {
    setBusy(purpose);
    try {
      setData(await api("/me/consents/", { method: "POST", body: { purpose, granted } }));
      refreshUser();
      toast.success(granted ? "Consent granted" : "Consent withdrawn");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const anonymise = async () => {
    try {
      await api("/me/anonymise/", { method: "POST", body: { confirm } });
      toast.success("Your consent is withdrawn and personal details anonymised.");
      logout();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading && !data) return <LoadingBlock />;
  return (
    <>
      <PageHeader title={t("consent.title")} description={`Purpose-based consent, version ${data?.version}. You can change these at any time.`} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardContent className="divide-y p-0">
            {data?.state.map((c) => (
              <div key={c.purpose} className="flex items-center gap-4 p-4 sm:p-5">
                <div className={`rounded-xl p-2 ${c.granted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.granted ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.label}</div>
                  {c.required && <Badge variant="secondary" className="mt-1">{t("reg.consent.required")}</Badge>}
                </div>
                <Switch checked={c.granted} disabled={c.required || busy === c.purpose} onCheckedChange={(v) => toggle(c.purpose, v)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4" />{t("consent.history")}</CardTitle></CardHeader>
            <CardContent className="max-h-80 space-y-2 overflow-y-auto">
              {data?.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <span className="flex-1">{h.purpose_label}</span>
                  <Badge variant={h.granted ? "success" : "destructive"}>{h.granted ? "Granted" : "Withdrawn"}</Badge>
                  <span className="w-28 text-right text-muted-foreground">{fmtDateTime(h.created_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>{t("consent.withdraw")}</CardTitle>
              <CardDescription>Withdraws every consent, removes your name, phone, email and date of birth, and closes your account. De-identified records stop counting in analytics.</CardDescription>
            </CardHeader>
            <CardContent><Button variant="destructive" onClick={() => setWithdraw(true)}>{t("consent.withdraw")}</Button></CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={withdraw} onOpenChange={setWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This cannot be undone</DialogTitle>
            <DialogDescription>Type WITHDRAW to confirm. You will be logged out and will need to register again to use SkillTrace.</DialogDescription>
          </DialogHeader>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="WITHDRAW" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdraw(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" disabled={confirm !== "WITHDRAW"} onClick={anonymise}>{t("consent.withdraw")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
