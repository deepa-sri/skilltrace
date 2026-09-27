"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Play, ScrollText } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fmtDateTime } from "@/lib/utils";

export default function Operations() {
  const [q, setQ] = useState("");
  const audit = useApi("/admin/audit/", { action: q });
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const runEngine = async () => {
    setBusy(true);
    try { const r = await api("/admin/followups/run/", { method: "POST", body: {} }); setRun(r); toast.success(`${r.sent} follow-ups sent`); audit.reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Follow-ups & audit" description="Operate the longitudinal follow-up engine and review every sensitive action." />
      <Card className="mb-6">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Follow-up engine</CardTitle><CardDescription>Sends due check-ins (in-app), retries weekly, and marks trainees unreachable after 3 attempts. In production, schedule <code className="font-mono text-xs">python manage.py run_followups</code> daily.</CardDescription></div>
          <Button onClick={runEngine} loading={busy}><Play />Run now</Button>
        </CardHeader>
        {run && <CardContent className="flex flex-wrap gap-2 text-sm"><Badge variant="success">{run.sent} sent</Badge><Badge variant="destructive">{run.unreachable} marked unreachable</Badge><Badge variant="outline">run on {run.run_on}</Badge></CardContent>}
      </Card>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" />Audit log</CardTitle>
          <Input className="sm:w-64" placeholder="Filter by action, e.g. consent" value={q} onChange={(e) => setQ(e.target.value)} />
        </CardHeader>
        <CardContent className="p-0">
          {audit.loading && !audit.data ? <div className="p-5"><LoadingBlock rows={2} /></div> : (
            <Table>
              <THead><TR><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Entity</TH><TH>Details</TH></TR></THead>
              <TBody>
                {audit.data?.map((a) => (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(a.created_at)}</TD>
                    <TD className="text-xs">{a.actor_name}</TD>
                    <TD><Badge variant="outline" className="font-mono">{a.action}</Badge></TD>
                    <TD className="text-xs">{a.entity} {a.entity_id && <span className="font-mono text-muted-foreground">#{String(a.entity_id).slice(0, 8)}</span>}</TD>
                    <TD className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">{Object.keys(a.meta || {}).length ? JSON.stringify(a.meta) : ""}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
