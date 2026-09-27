"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ClipboardCheck, Plus, Sparkles, Trash2 } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

const EXP = [{ value: "NONE", label: "No work experience" }, { value: "LT1", label: "Less than 1 year" }, { value: "1TO3", label: "1 to 3 years" }, { value: "GT3", label: "More than 3 years" }];

export default function SkillsPage() {
  const { t } = useI18n();
  const mine = useApi("/me/skills/");
  const tax = useApi("/skills/");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ skill: "", experience: "NONE", evidence_note: "" });
  const [busy, setBusy] = useState(false);
  const have = new Set((mine.data || []).map((s) => s.skill));

  const add = async () => {
    setBusy(true);
    try {
      mine.setData(await api("/me/skills/", { method: "POST", body: f }));
      toast.success("Skill added. Take its assessment to verify it.");
      setOpen(false);
      setF({ skill: "", experience: "NONE", evidence_note: "" });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    try { await api(`/me/skills/${id}/`, { method: "DELETE" }); mine.reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title={t("nav.skills")} description="Declared skills are unverified until you pass an assessment. Certificate status and assessment results are shown separately."
        actions={<Button onClick={() => setOpen(true)}><Plus />{t("skills.add")}</Button>} />
      {mine.loading && !mine.data ? <LoadingBlock /> : !mine.data?.length ? (
        <EmptyState icon={Sparkles} title="No skills yet" description="Add skills from the standard taxonomy. Skills from your training programmes are added automatically on completion." action={<Button onClick={() => setOpen(true)}>{t("skills.add")}</Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead><TR><TH>Skill</TH><TH>Source</TH><TH>Assessment</TH><TH>Competency</TH><TH>Best score</TH><TH>Last assessed</TH><TH></TH></TR></THead>
              <TBody>
                {mine.data.map((s) => (
                  <TR key={s.id}>
                    <TD><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.category}</div></TD>
                    <TD><Badge variant="outline">{s.source_label}</Badge>{s.certificate && <div className="mt-1 text-[11px] text-muted-foreground">linked certificate</div>}</TD>
                    <TD><StatusBadge status={s.assessment_status} /></TD>
                    <TD>{s.competency_level === "NOT_ASSESSED" ? <span className="text-xs text-muted-foreground">{t("skills.unverified")}</span> : <StatusBadge status={s.competency_level} />}</TD>
                    <TD className="font-semibold">{s.best_score ?? "—"}</TD>
                    <TD className="text-xs text-muted-foreground">{fmtDate(s.last_assessed)}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.has_assessment ? (
                          <Button asChild size="sm" variant="outline"><Link href={`/trainee/assessments?skill=${s.skill}`}><ClipboardCheck />Assess</Link></Button>
                        ) : <span className="self-center text-[11px] text-muted-foreground">Question bank pending</span>}
                        {s.best_score == null && <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(s.id)}><Trash2 /></Button>}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("skills.add")}</DialogTitle></DialogHeader>
          <Field label="Skill"><Select value={String(f.skill)} onValueChange={(v) => setF({ ...f, skill: Number(v) })}
            options={(tax.data || []).filter((s) => !have.has(s.id)).map((s) => ({ value: String(s.id), label: `${s.name} · ${s.category}${s.has_assessment ? "" : " (no test yet)"}` }))} /></Field>
          <Field label="Experience"><Select value={f.experience} onValueChange={(v) => setF({ ...f, experience: v })} options={EXP} /></Field>
          <Field label="Evidence or note (optional)"><Input value={f.evidence_note} onChange={(e) => setF({ ...f, evidence_note: e.target.value })} placeholder="e.g. worked 6 months at a cyber café" /></Field>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={add} disabled={!f.skill} loading={busy}>{t("common.add")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
