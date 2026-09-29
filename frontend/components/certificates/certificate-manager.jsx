"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Download, EllipsisVertical, Eye, FileUp, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, surface } from "@/components/shared/cards";
import { IconTile } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { FieldError, ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { certificates as initial } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All Certificates", short: "All" },
  { value: "verified", label: "Verified", short: "Verified" },
  { value: "pending", label: "Pending", short: "Pending" },
  { value: "rejected", label: "Rejected", short: "Rejected" },
];

const EMPTY_FORM = { title: "", issuer: "", credentialId: "", date: undefined, file: null };

function UploadDialog({ onUpload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e) {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = "Certificate name is required.";
    if (!form.issuer.trim()) next.issuer = "Issuing institute is required.";
    if (!form.credentialId.trim()) next.credentialId = "Credential ID is required for verification.";
    if (!form.date) next.date = "Select the issue date.";
    if (!form.file) next.file = "Attach the certificate (PDF, JPG or PNG).";
    else if (form.file.size > 5 * 1024 * 1024) next.file = "File must be 5 MB or smaller.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onUpload({
      id: `c${Date.now()}`,
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      credentialId: form.credentialId.trim(),
      issued: format(form.date, "dd MMM yyyy"),
      status: "pending",
      note: "Submitted for verification with the issuing institute.",
      tone: "blue",
    });
    setForm(EMPTY_FORM);
    setOpen(false);
    toast.success("Certificate uploaded", { description: "Verification usually takes 2–3 working days." });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Upload Certificate"
      description="We verify each certificate against the issuer's records."
      trigger={
        <Button className="h-11 rounded-[10px] px-5">
          <Upload /> Upload Certificate
        </Button>
      }
    >
      <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="c-title">Certificate name</Label>
          <Input id="c-title" value={form.title} onChange={(e) => set("title", e.target.value)} aria-invalid={!!errors.title} aria-describedby="c-title-error" />
          <FieldError id="c-title-error" message={errors.title} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="c-issuer">Issued by</Label>
            <Input id="c-issuer" value={form.issuer} onChange={(e) => set("issuer", e.target.value)} aria-invalid={!!errors.issuer} aria-describedby="c-issuer-error" />
            <FieldError id="c-issuer-error" message={errors.issuer} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="c-date">Issue date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="c-date"
                  variant="outline"
                  aria-invalid={!!errors.date}
                  aria-describedby="c-date-error"
                  className={cn("justify-start font-normal", !form.date && "text-muted-foreground")}
                >
                  <CalendarDays /> {form.date ? format(form.date, "dd MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={form.date} onSelect={(d) => set("date", d)} disabled={{ after: new Date() }} captionLayout="dropdown" />
              </PopoverContent>
            </Popover>
            <FieldError id="c-date-error" message={errors.date} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="c-cred">Credential ID</Label>
          <Input id="c-cred" value={form.credentialId} onChange={(e) => set("credentialId", e.target.value)} aria-invalid={!!errors.credentialId} aria-describedby="c-cred-error" />
          <FieldError id="c-cred-error" message={errors.credentialId} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <span className="text-sm font-medium">Certificate file</span>
          <Label
            htmlFor="c-file"
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center font-normal hover:border-blue-300 focus-within:ring-[3px] focus-within:ring-ring/50",
              errors.file && "border-rose-300"
            )}
          >
            <FileUp className="size-6 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">{form.file ? form.file.name : "Choose a file to upload"}</span>
            <span className="text-xs text-muted-foreground">PDF, JPG or PNG · up to 5 MB</span>
            <input
              id="c-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              aria-describedby="c-file-error"
              onChange={(e) => set("file", e.target.files?.[0] ?? null)}
            />
          </Label>
          <FieldError id="c-file-error" message={errors.file} />
        </div>
        <div className="flex gap-2 sm:justify-end max-sm:flex-col-reverse">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Submit for verification</Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function DetailsDialog({ cert, open, onOpenChange, onReverify }) {
  if (!cert) return null;
  const rows = [
    ["Issued by", cert.issuer],
    ["Issue date", cert.issued],
    ["Credential ID", cert.credentialId],
    ["Verified by", cert.verifiedBy ?? "—"],
    ["Verified on", cert.verifiedOn ?? "—"],
  ];
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={cert.title}
      description="Verification details"
      footer={
        cert.status !== "verified" && (
          <Button onClick={() => onReverify(cert)}>
            <RefreshCw /> Request re-verification
          </Button>
        )
      }
    >
      <StatusBadge status={cert.status} withIcon />
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium break-all">{value}</dd>
          </div>
        ))}
      </dl>
      {cert.note && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{cert.note}</p>}
    </ResponsiveDialog>
  );
}

export function CertificateManager() {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState(null);
  const shown = filter === "all" ? items : items.filter((c) => c.status === filter);

  const download = (cert) => toast.info(`Downloading ${cert.title}`, { description: "Demo — no file is generated." });
  const reverify = (cert) => {
    setItems((list) => list.map((c) => (c.id === cert.id ? { ...c, status: "pending", note: "Re-verification requested." } : c)));
    setViewing(null);
    toast.success("Re-verification requested");
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title="My Certificates"
        description="Upload and verify your certificates"
        actions={<UploadDialog onUpload={(c) => setItems((list) => [c, ...list])} />}
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="scrollbar-none h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
          {FILTERS.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              className="h-10 flex-none rounded-xl border-slate-200 bg-slate-100/80 px-4 text-slate-600 data-[state=active]:border-blue-100 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <span className="md:hidden">{f.short}</span>
              <span className="max-md:hidden">{f.label}</span>
              <span className="ml-1 text-xs text-slate-400">
                {f.value === "all" ? items.length : items.filter((c) => c.status === f.value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {shown.length ? (
        <ul className={cn(surface, "divide-y divide-slate-100 p-2")}>
          {shown.map((cert) => (
            <li key={cert.id} className="flex items-center gap-3 p-3 md:gap-4">
              <IconTile name="certificate" tone={cert.tone} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{cert.title}</p>
                <p className="truncate text-xs text-muted-foreground">{cert.issuer}</p>
                <p className="text-xs text-muted-foreground">Issued: {cert.issued}</p>
                <StatusBadge status={cert.status} withIcon className="mt-1.5 md:hidden" />
              </div>
              <StatusBadge status={cert.status} withIcon className="max-md:hidden" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="max-md:hidden" aria-label={`Download ${cert.title}`} onClick={() => download(cert)}>
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" className="rounded-lg border-blue-200 px-4 text-blue-600 max-md:hidden" onClick={() => setViewing(cert)}>
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10" aria-label={`More actions for ${cert.title}`}>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onSelect={() => setViewing(cert)}>
                    <Eye /> View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => download(cert)}>
                    <Download /> Download
                  </DropdownMenuItem>
                  {cert.status !== "verified" && (
                    <DropdownMenuItem onSelect={() => reverify(cert)}>
                      <RefreshCw /> Request re-verification
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No certificates here" description="Certificates with this status will appear here." />
      )}

      <DetailsDialog cert={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} onReverify={reverify} />
    </div>
  );
}
