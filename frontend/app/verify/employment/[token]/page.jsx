"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { Aurora, LoadingBlock } from "@/components/common";
import VerificationCard from "@/components/verification-card";
import { api } from "@/lib/api";

export default function TokenVerify() {
  const { token } = useParams();
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api(`/verify/employment/${token}/`, { auth: false }).then(setV).catch(setErr); }, [token]);
  const respond = async (_v, body) => {
    try { setV(await api(`/verify/employment/${token}/`, { method: "POST", auth: false, body })); toast.success("Thank you. Your response is recorded."); }
    catch (e) { toast.error(e.message); }
  };
  return (
    <div className="relative min-h-screen">
      <Aurora className="opacity-60" />
      <div className="relative mx-auto max-w-xl px-4 py-10">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Employment verification request</h1>
        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />A trainee reported working at your organisation and consented to this check. Please confirm only what your records show.</p>
        <div className="mt-6">{err ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{err.message}</div> : !v ? <LoadingBlock rows={1} /> : <VerificationCard v={v} onRespond={respond} />}</div>
      </div>
    </div>
  );
}
