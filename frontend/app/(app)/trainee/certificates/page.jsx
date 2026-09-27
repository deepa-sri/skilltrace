"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { FileCheck2, Info, Plus, RefreshCw, UploadCloud } from "lucide-react";
import { CheckList } from "@/components/check-list";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { cn, fmtDate } from "@/lib/utils";

function UploadDialog({ open, onOpenChange, onDone }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [issuers, setIssuers] = useState([]);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const input = useRef();
  const [f, setF] = useState({ holder_name: user.full_name, issuer_name: "", cert_number: "", course_name: "", issue_date: "", expiry_date: "" });
  useEffect(() => { if (open) { api("/issuers/").then(setIssuers); setResult(null); } }, [open]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => v && form.append(k, v));
    if (file) form.append("file", file);
    try {
      const rec = await api("/me/certificates/", { method: "POST", form });
      setResult(rec);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{result ? "Verification result" : t("cert.upload")}</DialogTitle>
          <DialogDescription>{t("cert.note")}</DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                <div><div className="text-sm font-semibold">{result.course_name}</div><div className="font-mono text-xs text-muted-foreground">{result.cert_number}</div></div>
                <StatusBadge status={result.status} />
              </div>
              <CheckList checks={result.checks} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setResult(null); setFile(null); setF((s) => ({ ...s, cert_number: "", course_name: "" })); }}>Submit another</Button>
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </div>
            </motion.div>
          ) : (
            <motion.form key="f" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cert.holder")}><Input value={f.holder_name} onChange={set("holder_name")} required /></Field>
              <Field label={t("cert.issuer")}>
                <Input list="issuers" value={f.issuer_name} onChange={set("issuer_name")} required placeholder="Start typing" />
                <datalist id="issuers">{issuers.map((i) => <option key={i.id} value={i.name} />)}</datalist>
              </Field>
              <Field label={t("cert.number")}><Input value={f.cert_number} onChange={set("cert_number")} required className="font-mono" /></Field>
              <Field label={t("cert.course")}><Input value={f.course_name} onChange={set("course_name")} required /></Field>
              <Field label={t("cert.issue")}><Input type="date" value={f.issue_date} onChange={set("issue_date")} required /></Field>
              <Field label={t("cert.expiry")}><Input type="date" value={f.expiry_date} onChange={set("expiry_date")} /></Field>
              <div className="sm:col-span-2">
                <div className="mb-1.5 text-sm font-medium">{t("cert.file")}</div>
                <button type="button" onClick={() => input.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files?.[0] || null); }}
                  className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm transition", drag ? "border-primary bg-primary/5" : "hover:border-primary/60")}>
                  <UploadCloud className="h-7 w-7 text-primary" />
                  {file ? <span className="font-medium">{file.name} · {(file.size / 1024).toFixed(0)} KB</span> : <span className="text-muted-foreground">Drag a file here or tap to choose</span>}
                </button>
                <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
                <Button type="submit" loading={busy}>Verify certificate</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default function CertificatesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, loading, reload } = useApi("/me/certificates/");
  const [open, setOpen] = useState(false);
  const consent = user.profile?.consent_state?.CERT_VERIFICATION;

  const act = async (path, msg) => {
    try { await api(path, { method: "POST", body: {} }); toast.success(msg); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title={t("nav.certificates")} description={t("cert.note")}
        actions={<Button onClick={() => setOpen(true)} disabled={!consent}><Plus />{t("cert.upload")}</Button>} />
      {!consent && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-saffron/40 bg-saffron/10 p-4 text-sm">
          <Info className="h-4 w-4 text-saffron" /><span className="flex-1">Certificate verification consent is off.</span>
          <Button asChild size="sm" variant="outline"><Link href="/trainee/consent">Review consent</Link></Button>
        </div>
      )}
      {loading && !data ? <LoadingBlock /> : !data?.length ? (
        <EmptyState icon={FileCheck2} title="No certificates yet" description="Submit your training certificate. We check the issuer registry, duplicates and inconsistencies." action={consent && <Button onClick={() => setOpen(true)}>{t("cert.upload")}</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{c.course_name}</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">{c.issuer_matched || c.issuer_name} · issued {fmtDate(c.issue_date)}</div>
                  <div className="mt-0.5 font-mono text-xs">{c.cert_number}</div>
                </div>
                <StatusBadge status={c.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <CheckList checks={c.checks} />
                {c.review_notes && <div className="rounded-lg bg-muted/60 p-3 text-xs"><span className="font-semibold">Review note: </span>{c.review_notes}</div>}
                <div className="flex flex-wrap gap-2">
                  {c.file_url && <Button asChild size="sm" variant="ghost"><a href={c.file_url} target="_blank" rel="noreferrer">{t("common.view")} file</a></Button>}
                  {["DOCUMENT_CHECKED", "VERIFICATION_UNAVAILABLE", "PARTIALLY_VERIFIED", "PENDING"].includes(c.status) && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act(`/me/certificates/${c.id}/reverify/`, "Checks re-run")}><RefreshCw />Re-run checks</Button>
                      <Button size="sm" variant="outline" onClick={() => act(`/me/certificates/${c.id}/request-review/`, "Sent to a verification officer")}>Request manual review</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <UploadDialog open={open} onOpenChange={setOpen} onDone={reload} />
    </>
  );
}
