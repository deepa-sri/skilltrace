"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck, Search, UserPlus } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const STATUS = [{ value: "ALL", label: "All statuses" }, { value: "ENROLLED", label: "Enrolled" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "COMPLETED", label: "Completed" }, { value: "DROPOUT", label: "Dropped out" }];

export default function Enrollments() {
  const progs = useApi("/provider/programmes/");
  const [filt, setFilt] = useState({ programme: "", status: "", q: "" });
  const { data, loading, reload } = useApi("/provider/enrollments/", filt);
  const [add, setAdd] = useState(false);
  const [nf, setNf] = useState({ uti: "", programme: "" });
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const enroll = async () => {
    setBusy(true);
    try { await api("/provider/enrollments/", { method: "POST", body: nf }); toast.success("Trainee enrolled and notified"); setAdd(false); setNf({ uti: "", programme: "" }); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const update = async (body) => {
    setBusy(true);
    try { const r = await api(`/provider/enrollments/${edit.id}/`, { method: "PATCH", body }); toast.success(r.status === "COMPLETED" ? `Completed. Certificate ${r.certificate_number || ""} issued and follow-ups scheduled.` : "Updated"); setEdit(null); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const progOpts = (progs.data || []).map((p) => ({ value: String(p.id), label: p.name }));

  return (
    <>
      <PageHeader title="Enrollments" description="Confirm enrollment, record attendance and mark completion. Completion issues a certificate in your issuer registry and schedules follow-ups."
        actions={<Button onClick={() => setAdd(true)}><UserPlus />Enroll by UTI</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Name or UTI" value={filt.q} onChange={(e) => setFilt({ ...filt, q: e.target.value })} /></div>
        <Select value={filt.programme || "ALL"} onValueChange={(v) => setFilt({ ...filt, programme: v === "ALL" ? "" : v })} options={[{ value: "ALL", label: "All programmes" }, ...progOpts]} />
        <Select value={filt.status || "ALL"} onValueChange={(v) => setFilt({ ...filt, status: v === "ALL" ? "" : v })} options={STATUS} />
      </div>
      {loading && !data ? <LoadingBlock /> : !data?.length ? <EmptyState title="No enrollments match" /> : (
        <Card><CardContent className="p-0">
          <Table>
            <THead><TR><TH>Trainee</TH><TH>Programme</TH><TH>Cohort</TH><TH className="text-right">Attendance</TH><TH>Status</TH><TH>Certificate</TH><TH></TH></TR></THead>
            <TBody>{data.map((e) => (
              <TR key={e.id}>
                <TD><div className="font-medium">{e.trainee_name}</div><div className="font-mono text-xs text-muted-foreground">{e.trainee_uti}</div></TD>
                <TD className="text-sm">{e.programme_detail.name}</TD>
                <TD className="text-xs">{e.cohort}</TD>
                <TD className="text-right tabular-nums">{e.attendance_pct}%</TD>
                <TD><StatusBadge status={e.status} />{!e.provider_confirmed && <div className="text-[11px] text-saffron">needs confirmation</div>}</TD>
                <TD className="font-mono text-xs">{e.certificate_number || "—"}<div className="font-sans text-muted-foreground">{fmtDate(e.completion_date)}</div></TD>
                <TD><Button size="sm" variant="outline" onClick={() => setEdit({ ...e, issue: true })}>Manage</Button></TD>
              </TR>
            ))}</TBody>
          </Table>
        </CardContent></Card>
      )}
      <Dialog open={add} onOpenChange={setAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll a trainee</DialogTitle><DialogDescription>Trainees register once and share their UTI. This avoids duplicate records across programmes.</DialogDescription></DialogHeader>
          <Field label="Unique Trainee ID"><Input className="font-mono" placeholder="MH-PNE-2026-000123" value={nf.uti} onChange={(e) => setNf({ ...nf, uti: e.target.value.toUpperCase() })} /></Field>
          <Field label="Programme"><Select value={nf.programme} onValueChange={(v) => setNf({ ...nf, programme: v })} options={progOpts} /></Field>
          <DialogFooter><Button onClick={enroll} loading={busy} disabled={!nf.uti || !nf.programme}>Enroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.trainee_name}</DialogTitle><DialogDescription>{edit?.programme_detail.name} · {edit?.trainee_uti}</DialogDescription></DialogHeader>
          {edit && <>
            <Field label="Attendance %"><Input type="number" min="0" max="100" value={edit.attendance_pct} onChange={(e) => setEdit({ ...edit, attendance_pct: e.target.value })} /></Field>
            {edit.status !== "COMPLETED" && <label className="flex items-center gap-2 text-sm"><Checkbox checked={edit.issue} onCheckedChange={(v) => setEdit({ ...edit, issue: !!v })} />Issue certificate on completion</label>}
          </>}
          <DialogFooter className="flex-wrap">
            {edit && edit.status !== "COMPLETED" && <>
              <Button variant="destructive" onClick={() => update({ attendance_pct: edit.attendance_pct, status: "DROPOUT" })}>Mark dropout</Button>
              {!edit.provider_confirmed && <Button variant="outline" onClick={() => update({ attendance_pct: edit.attendance_pct, confirm: true })}>Confirm enrollment</Button>}
              <Button variant="outline" onClick={() => update({ attendance_pct: edit.attendance_pct })} loading={busy}>Save attendance</Button>
              <Button onClick={async () => { await api(`/provider/enrollments/${edit.id}/`, { method: "PATCH", body: { attendance_pct: edit.attendance_pct, confirm: true } }).catch(() => {}); update({ status: "COMPLETED", issue_certificate: edit.issue }); }} loading={busy}><CheckCheck />Mark completed</Button>
            </>}
            {edit?.status === "COMPLETED" && <Button onClick={() => update({ attendance_pct: edit.attendance_pct })}>Save</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
