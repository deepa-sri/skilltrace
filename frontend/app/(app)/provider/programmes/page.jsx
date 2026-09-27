"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const MODES = [{ value: "CLASSROOM", label: "Classroom" }, { value: "ONLINE", label: "Online" }, { value: "BLENDED", label: "Blended" }, { value: "OJT", label: "On-the-job" }];

export default function Programmes() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi("/provider/programmes/");
  const skills = useApi("/skills/");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const blank = { name: "", code: "", sector: "", funding_scheme: "PMKVY 4.0", duration_hours: 240, delivery_mode: "CLASSROOM", nsqf_level: 4, qp_code: "", target_skills: [], district: user.district, cohort_size: 30, start_date: "", end_date: "", description: "" };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });

  const create = async () => {
    setBusy(true);
    try { const b = { ...f }; ["start_date", "end_date"].forEach((k) => !b[k] && delete b[k]); await api("/provider/programmes/", { method: "POST", body: b }); toast.success("Programme created"); setOpen(false); setF(blank); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const toggle = async (p) => { await api(`/provider/programmes/${p.id}/`, { method: "PATCH", body: { is_active: !p.is_active } }); reload(); };

  return (
    <>
      <PageHeader title="Programmes" description="Target skills drive automatic skill records for trainees on completion." actions={<Button onClick={() => setOpen(true)}><Plus />New programme</Button>} />
      {loading && !data ? <LoadingBlock /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div><div className="text-xs font-semibold text-primary">{p.code}</div><CardTitle>{p.name}</CardTitle><div className="text-xs text-muted-foreground">{p.sector} · {p.funding_scheme}</div></div>
                <Switch checked={p.is_active} onCheckedChange={() => toggle(p)} aria-label="Active" />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1">{p.target_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                <div className="grid grid-cols-3 gap-2 text-xs"><div><div className="text-muted-foreground">Enrolled</div><div className="font-semibold">{p.enrolled}</div></div><div><div className="text-muted-foreground">Hours</div><div className="font-semibold">{p.duration_hours}</div></div><div><div className="text-muted-foreground">Starts</div><div className="font-semibold">{fmtDate(p.start_date)}</div></div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New programme</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={f.name} onChange={set("name")} /></Field>
            <Field label="Code" hint="Unique, e.g. PMKVY-IT-JDA-02"><Input value={f.code} onChange={set("code")} /></Field>
            <Field label="Sector"><Input value={f.sector} onChange={set("sector")} /></Field>
            <Field label="Funding scheme"><Input value={f.funding_scheme} onChange={set("funding_scheme")} /></Field>
            <Field label="Hours"><Input type="number" value={f.duration_hours} onChange={set("duration_hours")} /></Field>
            <Field label="Delivery"><Select value={f.delivery_mode} onValueChange={set("delivery_mode")} options={MODES} /></Field>
            <Field label="Start date"><Input type="date" value={f.start_date} onChange={set("start_date")} /></Field>
            <Field label="End date"><Input type="date" value={f.end_date} onChange={set("end_date")} /></Field>
            <Field label="Target skills" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5">{(skills.data || []).map((s) => {
                const on = f.target_skills.includes(s.name);
                return <button type="button" key={s.id} onClick={() => setF({ ...f, target_skills: on ? f.target_skills.filter((x) => x !== s.name) : [...f.target_skills, s.name] })}
                  className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>{s.name}</button>;
              })}</div>
            </Field>
            <Field label="Description" className="sm:col-span-2"><Textarea value={f.description} onChange={set("description")} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} loading={busy} disabled={!f.name || !f.code || !f.sector}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
