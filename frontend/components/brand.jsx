import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }) {
  return (
    <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-saffron", className)} aria-hidden>
      <svg viewBox="0 0 32 32" className="h-full w-full">
        <path d="M8 21c3-6 6 2 9-4s4-6 7-7" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="8" cy="21" r="2.2" fill="white" />
        <circle cx="24" cy="10" r="2.2" fill="white" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className, sub }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight">SkillTrace</span>
        {sub !== false && <span className="block text-[10.5px] font-medium text-muted-foreground">by JobGenie</span>}
      </span>
    </Link>
  );
}
