"use client";
import Link from "next/link";
import { Activity, ArrowRight, FileCheck2 } from "lucide-react";
import { PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/lib/use-api";

export default function OfficerHome() {
  const certs = useApi("/officer/certificates/", { status: "MANUAL_REVIEW" });
  const sess = useApi("/officer/assessments/", { review: "FLAGGED" });
  return (
    <>
      <PageHeader title="Verification desk" description="Human review for uncertain certificates and flagged assessment sessions. No automated signal is treated as proof on its own." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Certificates awaiting review" value={certs.data?.length} icon={FileCheck2} tone="saffron" />
        <StatCard label="Flagged assessment sessions" value={sess.data?.length} icon={Activity} tone="destructive" delay={0.05} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[["Certificate reviews", "/officer/certificates", "Holder name mismatches, duplicates, unregistered issuers and trainee-requested reviews."],
          ["Assessment reviews", "/officer/assessments", "Sessions with repeated tab switches, focus loss or unusual timing. Clear the result or invalidate the attempt."]].map(([t, h, d]) => (
          <Card key={h}><CardHeader><CardTitle>{t}</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">{d}</p><Button asChild><Link href={h}>Open queue<ArrowRight /></Link></Button></CardContent></Card>
        ))}
      </div>
    </>
  );
}
