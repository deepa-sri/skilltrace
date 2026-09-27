"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export function TabsList({ className, ...p }) {
  return <TabsPrimitive.List className={cn("no-scrollbar inline-flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-muted p-1 text-muted-foreground", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }) {
  return <TabsPrimitive.Trigger className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:size-4", className)} {...p} />;
}
export function TabsContent({ className, ...p }) {
  return <TabsPrimitive.Content className={cn("mt-4 focus-visible:outline-none", className)} {...p} />;
}
