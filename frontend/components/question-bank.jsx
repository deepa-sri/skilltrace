"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, Check, Sparkles, X } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

export default function QuestionBank() {
  const { data, loading, reload, setData } = useApi("/question-bank/");
  const [busy, setBusy] = useState(null);

  const generate = async (id) => {
    setBusy(id);
    try { const r = await api("/ai/generate-questions/", { method: "POST", body: { skill_id: id, count: 6 } }); toast.success(`${r.created} draft questions created for review`); reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  const review = async (ids, approve) => {
    try { setData(await api("/question-bank/", { method: "POST", body: approve ? { approve: ids } : { reject: ids } })); toast.success(approve ? "Approved" : "Removed"); }
    catch (e) { toast.error(e.message); }
  };

  if (loading && !data) return <LoadingBlock />;
  return (
    <>
      <PageHeader title="Assessment question bank" description={`${data.soft_questions} soft-skill questions active. AI-drafted questions stay inactive until a human approves them.`} />
      {!data.ai_enabled && <div className="mb-4 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">Gemini is not configured. Set <code className="font-mono">GEMINI_API_KEY</code> in the backend <code>.env</code> to draft questions for skills that have no bank yet.</div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead><TR><TH>Skill</TH><TH className="text-right">Active</TH><TH className="text-right">Drafts</TH><TH></TH></TR></THead>
              <TBody>
                {data.skills.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-medium">{s.name}</TD>
                    <TD className={cn("text-right tabular-nums", s.active < 4 && "text-saffron")}>{s.active}</TD>
                    <TD className="text-right tabular-nums">{s.pending}</TD>
                    <TD className="text-right"><Button size="sm" variant="ghost" disabled={!data.ai_enabled} loading={busy === s.id} onClick={() => generate(s.id)}><Sparkles />Draft</Button></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4" />Drafts awaiting review</CardTitle><CardDescription>Check accuracy, clarity and fairness before approving.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {!data.pending.length && <p className="text-sm text-muted-foreground">No drafts pending.</p>}
            {data.pending.map((q) => (
              <div key={q.id} className="rounded-xl border p-4">
                <Badge variant="outline">{q.skill}</Badge>
                <p className="mt-2 text-sm font-medium">{q.text}</p>
                <ol className="mt-2 space-y-1 text-sm">{q.options.map((o, i) => <li key={i} className={cn("rounded-md px-2 py-1", i === q.correct_index ? "bg-success/10 font-medium text-success" : "text-muted-foreground")}>{String.fromCharCode(65 + i)}. {o}</li>)}</ol>
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => review([q.id], true)}><Check />Approve</Button><Button size="sm" variant="outline" onClick={() => review([q.id], false)}><X />Reject</Button></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
