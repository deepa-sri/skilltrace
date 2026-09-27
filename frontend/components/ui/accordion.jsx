"use client";
import * as A from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = A.Root;
export function AccordionItem({ className, ...p }) {
  return <A.Item className={cn("border-b last:border-b-0", className)} {...p} />;
}
export function AccordionTrigger({ className, children, ...p }) {
  return (
    <A.Header className="flex">
      <A.Trigger className={cn("flex flex-1 items-center justify-between gap-3 py-3 text-left text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180", className)} {...p}>
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </A.Trigger>
    </A.Header>
  );
}
export function AccordionContent({ className, children, ...p }) {
  return (
    <A.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...p}>
      <div className={cn("pb-4", className)}>{children}</div>
    </A.Content>
  );
}
