"use client";

import { useMemo, useState } from "react";
import { Award, Building, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmptyState, surface } from "@/components/shared/cards";
import { IconTile } from "@/components/shared/icon";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { districts, programmeCategories, programmes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ALL = "all";

function Meta({ icon: MetaIcon, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-slate-600">
      <MetaIcon className="size-4 text-slate-400" aria-hidden="true" />
      {children}
    </li>
  );
}

function ProgrammeDetails({ programme }) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={programme.title}
      description={`${programme.category} · ${programme.provider}`}
      trigger={<Button className="mt-auto h-10 w-full rounded-[10px]">View Details</Button>}
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              toast.success("Enrolment request sent", { description: `${programme.provider} will confirm your seat.` });
            }}
          >
            Apply to enrol
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{programme.description}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {[
          ["Duration", programme.duration],
          ["District", programme.district],
          ["Mode", programme.mode],
          ["Starts", programme.starts],
          ["Seats", `${programme.seats} available`],
          ["Certification", programme.certification],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </ResponsiveDialog>
  );
}

export function ProgrammeBrowser() {
  const [category, setCategory] = useState(ALL);
  const [district, setDistrict] = useState(ALL);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programmes.filter(
      (p) =>
        (category === ALL || p.category === category) &&
        (district === ALL || p.district === district) &&
        (!q || `${p.title} ${p.provider} ${p.category}`.toLowerCase().includes(q))
    );
  }, [category, district, query]);

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[200px_200px_minmax(0,1fr)]">
        <SearchInput
          className="md:order-3 md:col-span-2 lg:col-span-1"
          label="Search programmes"
          placeholder="Search programs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category" className="!h-10 w-full rounded-xl bg-white max-md:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Categories</SelectItem>
            {programmeCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger aria-label="District" className="!h-10 w-full rounded-xl bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile category chips */}
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(v) => setCategory(v || ALL)}
          aria-label="Category"
          className="scrollbar-none -mx-4 w-auto justify-start gap-2 overflow-x-auto px-4 md:hidden"
        >
          {[ALL, ...programmeCategories].map((c) => (
            <ToggleGroupItem
              key={c}
              value={c}
              className="h-9 flex-none rounded-lg border border-slate-200 bg-white px-3.5 text-xs data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
            >
              {c === ALL ? "All" : c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {results.length} programme{results.length === 1 ? "" : "s"} found
      </p>

      {results.length ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <li key={p.id} className={cn(surface, "flex flex-col p-5")}>
              <div className="flex items-start gap-3">
                <IconTile name={p.icon} tone={p.tone} size="lg" />
                <div>
                  <h2 className="font-bold leading-snug text-slate-900">{p.title}</h2>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
              </div>
              <ul className="my-5 grid gap-2.5">
                <Meta icon={Building}>{p.provider}</Meta>
                <Meta icon={Clock}>{p.duration}</Meta>
                <Meta icon={MapPin}>{p.district}</Meta>
                <Meta icon={Award}>{p.certification}</Meta>
                <Meta icon={CalendarDays}>Starts {p.starts}</Meta>
                <Meta icon={Users}>{p.seats} seats</Meta>
              </ul>
              <ProgrammeDetails programme={p} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No programmes match" description="Try another category, district or search term.">
          <Button
            variant="outline"
            onClick={() => {
              setCategory(ALL);
              setDistrict(ALL);
              setQuery("");
            }}
          >
            Clear filters
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
