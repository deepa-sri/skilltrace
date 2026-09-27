"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CircleSlash, MessageSquareWarning } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { fmtDate, inr } from "@/lib/utils";

export default function VerificationCard({ v, onRespond }) {
  const [f, setF] = useState({ confirmed_role: v.claimed.role || "", confirmed_income: v.claimed.monthly_income || "", notes: "" });
  const [busy, setBusy] = useState(null);
  const go = async (decision) => {
    if (decision !== "CONFIRMED" && !f.notes.trim()) return toast.error("Add a short note explaining the rejection or dispute");
    setBusy(decision);
    try { await onRespond(v, { decision, ...f }); } finally { setBusy(null); }
  };
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div><CardTitle>{v.trainee}</CardTitle><div className="font-mono text-xs text-muted-foreground">{v.uti_masked}</div><div className="mt-1 text-xs text-muted-foreground">Requested {fmtDate(v.requested_at)}</div></div>
        <StatusBadge status={v.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-sm">
          {[["Employer", v.claimed.employer], ["Role", v.claimed.role], ["Start date", fmtDate(v.claimed.start_date)], ["Monthly income", inr(v.claimed.monthly_income)]].map(([k, x]) => <div key={k}><div className="text-xs text-muted-foreground">{k} (claimed)</div><div className="font-medium">{x || "—"}</div></div>)}
        </div>
        {v.status === "REQUESTED" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Confirmed role"><Input value={f.confirmed_role} onChange={(e) => setF({ ...f, confirmed_role: e.target.value })} /></Field>
              <Field label="Confirmed monthly pay (₹)"><Input type="number" value={f.confirmed_income} onChange={(e) => setF({ ...f, confirmed_income: e.target.value })} /></Field>
            </div>
            <Textarea placeholder="Note (required to reject or dispute)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              <Button loading={busy === "CONFIRMED"} onClick={() => go("CONFIRMED")}><Check />Confirm</Button>
              <Button variant="outline" loading={busy === "DISPUTED"} onClick={() => go("DISPUTED")}><MessageSquareWarning />Dispute details</Button>
              <Button variant="destructive" loading={busy === "REJECTED"} onClick={() => go("REJECTED")}><CircleSlash />Not our employee</Button>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Answered {fmtDate(v.responded_at)}{v.confirmed_role && ` · role ${v.confirmed_role}`}{v.confirmed_income && ` · ${inr(v.confirmed_income)}`}{v.notes && ` · "${v.notes}"`}</div>
        )}
      </CardContent>
    </Card>
  );
}
