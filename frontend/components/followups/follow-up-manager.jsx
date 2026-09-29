"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Send, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, SectionCard, surface } from "@/components/shared/cards";
import { IconTile } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { FieldError, ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { districts, employmentStatuses, followUpChannels, followUps as initial } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ALL = "all";
const PAGE_SIZE = 5;
const CHANNELS = followUpChannels.slice(0, 4).map((c) => c.name);
const OPEN_STATUSES = ["due", "scheduled", "sent"];

function SendDialog({ open, onOpenChange, targets, onSend }) {
  const [channel, setChannel] = useState("WhatsApp");
  const [message, setMessage] = useState(
    "Hi! This is your SkillTrace follow-up. Please share your current employment status and monthly income."
  );
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    if (message.trim().length < 20) return setError("Message should be at least 20 characters.");
    setError("");
    onSend(channel);
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={targets.length === 1 ? `Send follow-up to ${targets[0].name}` : `Send follow-up to ${targets.length} trainees`}
      description="Trainees respond through a secure link; answers update their outcome record."
    >
      <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="fu-channel">Channel</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger id="fu-channel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="fu-message">Message</Label>
          <Textarea id="fu-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!error} aria-describedby="fu-message-error" />
          <FieldError id="fu-message-error" message={error} />
        </div>
        <div className="flex gap-2 sm:justify-end max-sm:flex-col-reverse">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!targets.length}>
            <Send /> Send
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

function UpdateDialog({ record, onOpenChange, onSave }) {
  const [employment, setEmployment] = useState(record?.employment ?? "Employed");
  const [date, setDate] = useState();
  const [error, setError] = useState("");
  if (!record) return null;
  function submit(e) {
    e.preventDefault();
    if (!date) return setError("Pick the next follow-up date.");
    onSave({ ...record, employment, status: "completed", lastFollowUp: format(new Date(), "dd MMM yyyy"), nextFollowUp: format(date, "dd MMM yyyy") });
  }
  return (
    <ResponsiveDialog open onOpenChange={onOpenChange} title={record.name} description={`${record.district} · via ${record.channel}`}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-muted-foreground">Last follow-up</dt>
          <dd className="font-semibold">{record.lastFollowUp}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-muted-foreground">Next follow-up</dt>
          <dd className="font-semibold">{record.nextFollowUp}</dd>
        </div>
      </dl>
      <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="fu-emp">Reported employment status</Label>
          <Select value={employment} onValueChange={setEmployment}>
            <SelectTrigger id="fu-emp" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employmentStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Label htmlFor="fu-next">Schedule next follow-up</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="fu-next" variant="outline" aria-describedby="fu-next-error" className={cn("justify-start font-normal", !date && "text-muted-foreground")}>
                <CalendarDays /> {date ? format(date, "dd MMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} />
            </PopoverContent>
          </Popover>
          <FieldError id="fu-next-error" message={error} />
        </div>
        <div className="flex gap-2 sm:justify-end max-sm:flex-col-reverse">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Mark completed</Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

export function FollowUpManager() {
  const [records, setRecords] = useState(initial);
  const [district, setDistrict] = useState(ALL);
  const [due, setDue] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [query, setQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [sendTargets, setSendTargets] = useState(null);
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(
      (r) =>
        (district === ALL || r.district === district) &&
        (status === ALL || r.status === status) &&
        (due === ALL || (due === "open" ? OPEN_STATUSES.includes(r.status) : r.status === "completed")) &&
        (!q || r.name.toLowerCase().includes(q))
    );
  }, [records, district, status, due, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const mobileRows = filtered.filter((r) => (mobileTab === "pending" ? r.status !== "completed" : r.status === "completed"));
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  function send(channel) {
    const ids = sendTargets.map((t) => t.id);
    setRecords((list) => list.map((r) => (ids.includes(r.id) ? { ...r, status: "sent", channel } : r)));
    setSelected([]);
    setSendTargets(null);
    toast.success(`Follow-up sent via ${channel}`, { description: `${ids.length} trainee${ids.length > 1 ? "s" : ""} notified.` });
  }

  function saveUpdate(updated) {
    setRecords((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    setViewing(null);
    toast.success(`Follow-up recorded for ${updated.name}`);
  }

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const actionFor = (r, className) =>
    r.status === "due" ? (
      <Button size="sm" className={cn("w-16 rounded-lg", className)} onClick={() => setSendTargets([r])}>
        Send
      </Button>
    ) : (
      <Button size="sm" variant="outline" className={cn("w-16 rounded-lg border-blue-300 text-blue-600", className)} onClick={() => setViewing(r)}>
        View
      </Button>
    );

  const bulkTargets = records.filter((r) => selected.includes(r.id));

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        title="Follow-up Management"
        description="Automated and assisted follow-ups to track outcomes"
        actions={
          <Button
            className="h-11 rounded-[10px] px-5"
            onClick={() => setSendTargets(bulkTargets.length ? bulkTargets : records.filter((r) => r.status === "due"))}
          >
            <Send /> Send Bulk Follow-up {selected.length > 0 && `(${selected.length})`}
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-4">
          <Collapsible className="flex flex-col gap-3 lg:flex-row-reverse">
            <div className="flex flex-1 gap-2">
              <SearchInput label="Search trainees" placeholder="Search trainees..." value={query} onChange={(e) => setFilter(setQuery)(e.target.value)} className="flex-1" />
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl bg-white md:hidden">
                  <SlidersHorizontal /> Filters
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent forceMount className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[504px] data-[state=closed]:max-md:hidden">
            <Select value={district} onValueChange={setFilter(setDistrict)}>
              <SelectTrigger aria-label="District" className="!h-10 w-full rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Trainees</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={due} onValueChange={setFilter(setDue)}>
              <SelectTrigger aria-label="Due window" className="!h-10 w-full rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any time</SelectItem>
                <SelectItem value="open">Due This Month</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setFilter(setStatus)}>
              <SelectTrigger aria-label="Status" className="!h-10 w-full rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Status</SelectItem>
                {["due", "scheduled", "sent", "completed"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </CollapsibleContent>
          </Collapsible>

          {/* Desktop table */}
          <div id="results" className={cn(surface, "overflow-hidden max-md:hidden")}>
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      onCheckedChange={(v) =>
                        setSelected((s) => (v ? [...new Set([...s, ...pageRows.map((r) => r.id)])] : s.filter((id) => !pageRows.some((r) => r.id === id))))
                      }
                    />
                  </TableHead>
                  <TableHead>Trainee Name</TableHead>
                  <TableHead>Last Follow-up</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employment Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id} data-state={selected.includes(r.id) ? "selected" : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox
                        aria-label={`Select ${r.name}`}
                        checked={selected.includes(r.id)}
                        onCheckedChange={(v) => setSelected((s) => (v ? [...s, r.id] : s.filter((id) => id !== r.id)))}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {r.name}
                      <span className="block text-xs font-normal text-muted-foreground">{r.district}</span>
                    </TableCell>
                    <TableCell>{r.lastFollowUp}</TableCell>
                    <TableCell>{r.nextFollowUp}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.employment} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">{actionFor(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!pageRows.length && <p className="p-8 text-center text-sm text-muted-foreground">No follow-ups match these filters.</p>}
            {pages > 1 && (
              <Pagination className="justify-end border-t p-3">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#results"
                      aria-disabled={current === 1}
                      className={cn(current === 1 && "pointer-events-none opacity-40")}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(current - 1);
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#results"
                        isActive={n === current}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#results"
                      aria-disabled={current === pages}
                      className={cn(current === pages && "pointer-events-none opacity-40")}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(current + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            <Tabs value={mobileTab} onValueChange={setMobileTab}>
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                {["pending", "completed"].map((t) => (
                  <TabsTrigger key={t} value={t} className="rounded-lg capitalize data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {mobileRows.length ? (
              <ul className="grid grid-cols-1 gap-3">
                {mobileRows.map((r) => (
                  <li key={r.id} className={cn(surface, "flex items-center gap-3 p-4")}>
                    <UserAvatar name={r.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Due · {r.nextFollowUp}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <StatusBadge status={r.status} />
                        <StatusBadge status={r.employment} />
                      </div>
                    </div>
                    {actionFor(r, "h-10")}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nothing here" description="No follow-ups match these filters." />
            )}
          </div>
        </div>

        <SectionCard title="Follow-up Channels">
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {followUpChannels.map((c) => (
              <li key={c.name} className="flex items-center gap-3 rounded-xl p-2">
                <IconTile name={c.icon} tone={c.tone} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {sendTargets && <SendDialog open onOpenChange={(o) => !o && setSendTargets(null)} targets={sendTargets} onSend={send} />}
      {viewing && <UpdateDialog key={viewing.id} record={viewing} onOpenChange={(o) => !o && setViewing(null)} onSave={saveUpdate} />}
    </div>
  );
}
