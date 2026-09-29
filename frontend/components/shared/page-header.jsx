import { cn } from "@/lib/utils";

// Title is visually hidden on mobile because the mobile top bar already shows it.
export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-start md:justify-between", className)}>
      <div className="max-md:sr-only">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 max-md:[&>*]:flex-1">{actions}</div>}
    </div>
  );
}
