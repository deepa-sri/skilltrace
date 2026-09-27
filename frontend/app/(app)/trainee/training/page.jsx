"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarDays, Clock, GraduationCap, Search } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { fmtDate } from "@/lib/utils";

export default function TrainingPage() {
  const { t } = useI18n();
  const mine = useApi("/me/enrollments/");
  const progs = useApi("/programmes/");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const enrolledIds = new Set((mine.data || []).map((e) => e.programme));
  const list = useMemo(() => (progs.data || []).filter((p) => !enrolledIds.has(p.id) && (p.name + p.sector + p.provider_name + p.district_name).toLowerCase().includes(q.toLowerCase())), [progs.data, q, mine.data]); // eslint-disable-line

  const enroll = async (id) => {
    setBusy(id);
    try {
      mine.setData(await api("/me/enrollments/", { method: "POST", body: { programme: id } }));
      toast.success("Enrolled. Your provider will confirm attendance and completion.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title={t("nav.training")} description="Your programmes, attendance and completion status. Providers confirm enrollment and completion." />
      {mine.loading && !mine.data ? <LoadingBlock rows={2} /> : mine.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.data.map((e) => (
            <Card key={e.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{e.programme_detail.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{e.programme_detail.provider_name}</div>
                </div>
                <StatusBadge status={e.status} />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{e.programme_detail.sector}</Badge><Badge variant="outline">{e.programme_detail.funding_scheme}</Badge>
                  {e.programme_detail.nsqf_level && <Badge variant="outline">NSQF {e.programme_detail.nsqf_level}</Badge>}
                </div>
                <div><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Attendance</span><span>{e.attendance_pct}%</span></div><Progress value={e.attendance_pct} /></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Enrolled</span><div>{fmtDate(e.enrolled_on)}</div></div>
                  <div><span className="text-muted-foreground">Completed</span><div>{fmtDate(e.completion_date)}</div></div>
                  <div><span className="text-muted-foreground">Provider confirmed</span><div>{e.provider_confirmed ? "Yes" : "Awaiting"}</div></div>
                  <div><span className="text-muted-foreground">Certificate no.</span><div className="font-mono">{e.certificate_number || "—"}</div></div>
                </div>
                <div className="flex flex-wrap gap-1">{e.programme_detail.target_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={GraduationCap} title="No training yet" description="Enroll below, or share your UTI with your training centre so they can add you." />}

      <div className="mb-4 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Available programmes</h2>
        <div className="relative sm:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search sector, district, provider" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <CardHeader>
              <div className="text-xs font-semibold text-primary">{p.sector} · {p.funding_scheme}</div>
              <CardTitle>{p.name}</CardTitle>
              <div className="text-xs text-muted-foreground">{p.provider_name} · {p.district_name}</div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm">
              <div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration_hours} h</span><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{p.delivery_mode.toLowerCase()}</span></div>
              <div className="flex flex-wrap gap-1">{p.target_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
              <Button className="mt-auto self-start" size="sm" variant="outline" loading={busy === p.id} onClick={() => enroll(p.id)}>Enroll</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
