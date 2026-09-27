"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/common";
import VerificationCard from "@/components/verification-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";

export default function EmployerHome() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi("/employer/verifications/");
  const [tab, setTab] = useState("REQUESTED");
  const respond = async (v, body) => {
    try { await api(`/employer/verifications/${v.id}/respond/`, { method: "POST", body }); toast.success("Response recorded. The trainee has been notified."); reload(); }
    catch (e) { toast.error(e.message); }
  };
  const rows = (data || []).filter((v) => (tab === "REQUESTED" ? v.status === "REQUESTED" : v.status !== "REQUESTED"));
  return (
    <>
      <PageHeader eyebrow={user.organisation} title="Employment verification" description="Trainees asked you to confirm the details they reported. You only see what the trainee consented to share." />
      <Tabs value={tab} onValueChange={setTab} className="mb-4"><TabsList>
        <TabsTrigger value="REQUESTED">Pending ({(data || []).filter((v) => v.status === "REQUESTED").length})</TabsTrigger>
        <TabsTrigger value="DONE">Answered</TabsTrigger>
      </TabsList></Tabs>
      {loading && !data ? <LoadingBlock /> : !rows.length ? <EmptyState icon={Building2} title="Nothing here" description="New requests appear here and in your notifications." /> : (
        <div className="grid gap-4 lg:grid-cols-2">{rows.map((v) => <VerificationCard key={v.id} v={v} onRespond={respond} />)}</div>
      )}
    </>
  );
}
