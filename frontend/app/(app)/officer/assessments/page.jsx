"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, AlertTriangle } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

export default function SessionReviews() {
  const [review, setReview] = useState("FLAGGED");
  const { data, loading, reload } = useApi("/officer/assessments/", { review });
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);
  const decide = async (id, decision) => {
    setBusy(id + decision);
    try { await api(`/officer/assessments/${id}/review/`, { method: "POST", body: { decision, notes: notes[id] || "" } }); toast.success("Review recorded"); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  return (
    <>
      <PageHeader title="Assessment reviews" description="Signals are indicators only. Consider context, such as a shared device or poor connectivity, before invalidating."
        actions={<div className="w-44"><Select value={review} onValueChange={setReview} options={[{ value: "FLAGGED", label: "Flagged" }, { value: "ALL", label: "All reviewed" }]} /></div>} />
      {loading && !data ? <LoadingBlock /> : !data?.length ? <EmptyState icon={Activity} title="No sessions to review" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div><CardTitle>{s.trainee}</CardTitle><div className="font-mono text-xs text-muted-foreground">{s.uti}</div><div className="mt-1 text-sm">{s.kind === "SOFT" ? "Soft-skill" : s.skill} · attempt {s.attempt_no} · {fmtDate(s.submitted_at)}</div></div>
                <div className="text-right"><div className="text-2xl font-bold">{s.score}</div><StatusBadge status={s.review_status} /></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {s.integrity?.flags?.map((f) => <Badge key={f} variant="saffron"><AlertTriangle />{f}</Badge>)}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[["Tab", s.integrity?.tab_switches], ["Focus", s.integrity?.focus_lost], ["Changes", s.integrity?.answer_changes], ["Used", `${Math.round((s.integrity?.seconds_used || 0) / 60)}m`]].map(([k, v]) => <div key={k} className="rounded-lg bg-muted/50 p-2"><div className="font-bold">{v ?? 0}</div><div className="text-muted-foreground">{k}</div></div>)}
                </div>
                {s.events?.length > 0 && <div className="max-h-28 overflow-y-auto rounded-lg border p-2 font-mono text-[11px] text-muted-foreground">{s.events.map((e, i) => <div key={i}>{new Date(e.at).toLocaleTimeString("en-IN")} · {e.type}{e.question_id ? ` · q${e.question_id}` : ""}</div>)}</div>}
                {s.review_status === "FLAGGED" ? (
                  <>
                    <Textarea placeholder="Review note (shared with trainee)" value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
                    <div className="flex gap-2"><Button size="sm" loading={busy === s.id + "CLEAR"} onClick={() => decide(s.id, "CLEAR")}>Clear result</Button><Button size="sm" variant="destructive" loading={busy === s.id + "INVALIDATE"} onClick={() => decide(s.id, "INVALIDATE")}>Invalidate attempt</Button></div>
                  </>
                ) : s.review_notes && <p className="text-sm text-muted-foreground">Note: {s.review_notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
