import { Input } from "@/components/ui/input";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function SearchInput({ className, label = "Search", ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <Input type="search" aria-label={label} className="h-10 rounded-xl bg-white pl-9" {...props} />
    </div>
  );
}
