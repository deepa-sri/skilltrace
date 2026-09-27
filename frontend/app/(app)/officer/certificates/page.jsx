"use client";
import { useState } from "react";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";
import { CheckList } from "@/components/check-list";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const FILTERS = [{ value: "MANUAL_REVIEW", label: "Manual review" }, { value: "PARTIALLY_VERIFIED", label: "Partially verified" }, { value: "VERIFICATION_UNAVAILABLE", label: "Unavailable" }, { value: "REJECTED", label: "Rejected" }, { value: "ALL", label: "All" }];

export default function CertReviews() {
  const [status, setStatus] = useState("MANUAL_REVIEW");
  const { data, loading, reload } = useApi("/officer/certificates/", { status });
  const [sel, setSel] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(null);

  const decide = async (decision) => {
    setBusy(decision);
    try { await api(`/officer/certificates/${sel.id}/decision/`, { method: "POST", body: { decision, notes } }); toast.success("Decision recorded"); setSel(null); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHeader title="Certificate reviews" actions={<div className="w-52"><Select value={status} onValueChange={setStatus} options={FILTERS} /></div>} />
      {loading && !data ? <LoadingBlock /> : !data?.length ? <EmptyState icon={FileCheck2} title="Queue is clear" /> : (
        <Card><CardContent className="p-0">
          <Table>
            <THead><TR><TH>Trainee</TH><TH>Certificate</TH><TH>Issuer</TH><TH>Status</TH><TH>Submitted</TH><TH></TH></TR></THead>
            <TBody>
              {data.map((c) => (
                <TR key={c.id}>
                  <TD><div className="font-medium">{c.trainee_name}</div><div className="font-mono text-xs text-muted-foreground">{c.trainee_uti}</div></TD>
                  <TD><div>{c.course_name}</div><div className="font-mono text-xs text-muted-foreground">{c.cert_number}</div></TD>
                  <TD className="text-xs">{c.issuer_matched || c.issuer_name}</TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TD>
                  <TD><Button size="sm" variant="outline" onClick={() => { setSel(c); setNotes(""); }}>Review</Button></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent></Card>
      )}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{sel?.course_name}</DialogTitle><DialogDescription>{sel?.trainee_name} · {sel?.trainee_uti} · holder on certificate: {sel?.holder_name}</DialogDescription></DialogHeader>
          {sel && <>
            <CheckList checks={sel.checks} />
            {sel.review_notes && <div className="rounded-lg bg-muted/60 p-3 text-sm">{sel.review_notes}</div>}
            {sel.file_url && <Button asChild variant="link" className="h-auto justify-start p-0"><a href={sel.file_url} target="_blank" rel="noreferrer">Open uploaded file</a></Button>}
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for your decision (required when rejecting). Shared with the trainee." />
          </>}
          <DialogFooter className="flex-wrap">
            <Button variant="destructive" loading={busy === "REJECTED"} onClick={() => decide("REJECTED")}>Reject</Button>
            <Button variant="outline" loading={busy === "VERIFICATION_UNAVAILABLE"} onClick={() => decide("VERIFICATION_UNAVAILABLE")}>Cannot verify</Button>
            <Button variant="outline" loading={busy === "PARTIALLY_VERIFIED"} onClick={() => decide("PARTIALLY_VERIFIED")}>Partially verified</Button>
            <Button loading={busy === "ISSUER_VERIFIED"} onClick={() => decide("ISSUER_VERIFIED")}>Verified with issuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
